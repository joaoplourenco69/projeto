const connection = require('../config/database');

const { paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');

function normalizarCep(cep) {
    return String(cep || '').replace(/\D/g, '');
}

function calcularDesconto(mensalidade) {
    const valor = Number(mensalidade);

    if (valor >= 99.9) {
        return 30;
    }
    if (valor >= 59.9) {
        return 20;
    }
    return 10;
}

async function consultarViaCep(cep) {
    const cepLimpo = normalizarCep(cep);

    if (cepLimpo.length !== 8) {
        throw new Error('CEP invalido');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    if (!response.ok || data.erro) {
        throw new Error('CEP nao encontrado');
    }

    return {
        cep: cepLimpo,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || ''
    };
}

class AssinaturaController {
    async consultarCep(req, res) {
        try {
            const endereco = await consultarViaCep(req.params.cep);
            return res.json(endereco);
        } catch (error) {
            throw badRequest(error.message);
        }
    }

    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        if (req.query.status) {
            filtros.push('a.status = ?');
            valores.push(req.query.status);
        }
        if (req.query.pagamento_status) {
            filtros.push('a.pagamento_status = ?');
            valores.push(req.query.pagamento_status);
        }
        if (req.query.usuario_id) {
            filtros.push('a.usuario_id = ?');
            valores.push(req.query.usuario_id);
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT a.*, u.nome AS usuario, p.nome_plano
             FROM assinaturas a
             INNER JOIN usuarios u ON u.id = a.usuario_id
             INNER JOIN planos p ON p.id = a.plano_id
             ${where}
             ORDER BY a.criado_em DESC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM assinaturas a
             ${where}`,
            valores
        );

        return res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async minhas(req, res) {
        const [rows] = await connection.query(
            `SELECT a.*, p.nome_plano, p.beneficios
             FROM assinaturas a
             INNER JOIN planos p ON p.id = a.plano_id
             WHERE a.usuario_id = ?
             ORDER BY a.criado_em DESC`,
            [req.usuario.id]
        );

        return res.json(rows);
    }

    async criar(req, res) {
        const usuarioId = req.usuario.tipo_usuario === 'Admin' && req.body.usuario_id ? req.body.usuario_id : req.usuario.id;
        const { plano_id, cep, numero, complemento, forma_pagamento = 'pix' } = req.body;

        const [planos] = await connection.query('SELECT * FROM planos WHERE id = ? LIMIT 1', [plano_id]);

        if (planos.length === 0) {
            throw notFound('Plano nao encontrado');
        }

        const [ativas] = await connection.query(
            `SELECT id FROM assinaturas
             WHERE usuario_id = ? AND status IN ('Pendente', 'Ativa')
             LIMIT 1`,
            [usuarioId]
        );

        if (ativas.length > 0) {
            throw conflict('Usuario ja possui assinatura pendente ou ativa');
        }

        let endereco;
        try {
            endereco = await consultarViaCep(cep);
        } catch (error) {
            throw badRequest(error.message);
        }

        const desconto = calcularDesconto(planos[0].mensalidade);
        const valorMensal = Number(planos[0].mensalidade);
        const valorFinal = Number((valorMensal * (1 - desconto / 100)).toFixed(2));

        const [result] = await connection.query(
            `INSERT INTO assinaturas (
                usuario_id, plano_id, status, forma_pagamento, pagamento_status,
                valor_mensal, desconto_percentual, valor_final,
                cep, logradouro, numero, complemento, bairro, cidade, uf
             )
             VALUES (?, ?, 'Pendente', ?, 'Pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                plano_id,
                forma_pagamento,
                valorMensal,
                desconto,
                valorFinal,
                endereco.cep,
                endereco.logradouro,
                numero,
                complemento,
                endereco.bairro,
                endereco.cidade,
                endereco.uf
            ]
        );

        return res.status(201).json({
            id: result.insertId,
            status: 'Pendente',
            pagamento_status: 'Pendente',
            valor_mensal: valorMensal,
            desconto_percentual: desconto,
            valor_final: valorFinal,
            mensagem: 'Assinatura criada. Aguarde aprovacao do pagamento.'
        });
    }

    async aprovar(req, res) {
        const { pagamento_status = 'Aprovado', motivo_recusa = null } = req.body;

        if (!['Aprovado', 'Recusado'].includes(pagamento_status)) {
            throw badRequest('pagamento_status deve ser Aprovado ou Recusado');
        }

        const status = pagamento_status === 'Aprovado' ? 'Ativa' : 'Suspensa';
        const [result] = await connection.query(
            `UPDATE assinaturas
             SET pagamento_status = ?, status = ?, motivo_recusa = ?, aprovado_em = CASE WHEN ? = 'Aprovado' THEN NOW() ELSE aprovado_em END
             WHERE id = ? AND status = 'Pendente'`,
            [pagamento_status, status, motivo_recusa, pagamento_status, req.params.id]
        );

        if (result.affectedRows === 0) {
            throw notFound('Assinatura pendente nao encontrada');
        }

        return res.json({ mensagem: pagamento_status === 'Aprovado' ? 'Pagamento aprovado e assinatura ativada' : 'Pagamento recusado' });
    }

    async cancelar(req, res) {
        const [rows] = await connection.query('SELECT usuario_id FROM assinaturas WHERE id = ? LIMIT 1', [req.params.id]);

        if (rows.length === 0) {
            throw notFound('Assinatura nao encontrada');
        }

        if (req.usuario.tipo_usuario !== 'Admin' && rows[0].usuario_id !== req.usuario.id) {
            throw forbidden('Acesso negado');
        }

        await connection.query(
            `UPDATE assinaturas
             SET status = 'Cancelada'
             WHERE id = ? AND status IN ('Pendente', 'Ativa', 'Suspensa')`,
            [req.params.id]
        );

        return res.json({ mensagem: 'Assinatura cancelada' });
    }
}

module.exports = new AssinaturaController();
