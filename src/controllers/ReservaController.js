const connection = require('../config/database');

const { paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');

const VALOR_INGRESSO_PADRAO = 80;

async function buscarAssinaturaAtiva(usuarioId) {
    const [rows] = await connection.query(
        `SELECT a.*, p.nome_plano
         FROM assinaturas a
         INNER JOIN planos p ON p.id = a.plano_id
         WHERE a.usuario_id = ? AND a.status = 'Ativa'
         ORDER BY a.aprovado_em DESC
         LIMIT 1`,
        [usuarioId]
    );

    return rows[0];
}

class ReservaController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        if (req.query.status) {
            filtros.push('r.status = ?');
            valores.push(req.query.status);
        }
        if (req.query.partida_id) {
            filtros.push('r.partida_id = ?');
            valores.push(req.query.partida_id);
        }
        if (req.query.usuario_id) {
            filtros.push('r.usuario_id = ?');
            valores.push(req.query.usuario_id);
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT r.*, u.nome AS usuario, p.adversario, p.data_hora
             FROM reservas_ingressos r
             INNER JOIN usuarios u ON u.id = r.usuario_id
             INNER JOIN partidas p ON p.id = r.partida_id
             ${where}
             ORDER BY r.criado_em DESC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM reservas_ingressos r
             ${where}`,
            valores
        );

        return res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async minhas(req, res) {
        const [rows] = await connection.query(
            `SELECT r.*, p.adversario, p.data_hora, p.local
             FROM reservas_ingressos r
             INNER JOIN partidas p ON p.id = r.partida_id
             WHERE r.usuario_id = ?
             ORDER BY r.criado_em DESC`,
            [req.usuario.id]
        );

        return res.json(rows);
    }

    async criar(req, res) {
        const partidaId = req.params.partidaId;
        const quantidade = Math.max(parseInt(req.body.quantidade, 10) || 1, 1);

        if (quantidade > 4) {
            throw badRequest('Cada socio pode bloquear no maximo 4 ingressos por partida');
        }

        const assinatura = await buscarAssinaturaAtiva(req.usuario.id);

        if (!assinatura) {
            throw forbidden('E necessario ter uma assinatura ativa para reservar ingressos');
        }

        const db = await connection.getConnection();

        try {
            await db.beginTransaction();

            const [partidas] = await db.query(
                `SELECT * FROM partidas
                 WHERE id = ? AND data_hora > NOW()
                 FOR UPDATE`,
                [partidaId]
            );

            if (partidas.length === 0) {
                await db.rollback();
                throw notFound('Partida futura nao encontrada');
            }

            const partida = partidas[0];
            const capacidade = Number(partida.capacidade_total || 0);
            const bloqueadas = Number(partida.vagas_bloqueadas || 0);
            const disponiveis = capacidade - bloqueadas;

            if (disponiveis < quantidade) {
                await db.rollback();
                throw conflict('Ingressos insuficientes para esta partida', { disponiveis });
            }

            const [jaReservado] = await db.query(
                `SELECT COALESCE(SUM(quantidade), 0) AS total
                 FROM reservas_ingressos
                 WHERE usuario_id = ? AND partida_id = ? AND status IN ('Bloqueada', 'Confirmada')`,
                [req.usuario.id, partidaId]
            );

            if (Number(jaReservado[0].total) + quantidade > 4) {
                await db.rollback();
                throw conflict('Limite de 4 ingressos por socio nesta partida excedido');
            }

            const desconto = Number(assinatura.desconto_percentual || 0);
            const valorUnitario = VALOR_INGRESSO_PADRAO;
            const valorTotal = Number((quantidade * valorUnitario * (1 - desconto / 100)).toFixed(2));

            const [result] = await db.query(
                `INSERT INTO reservas_ingressos (
                    usuario_id, partida_id, assinatura_id, quantidade, valor_unitario,
                    desconto_percentual, valor_total, status, expira_em
                 )
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Bloqueada', DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
                [req.usuario.id, partidaId, assinatura.id, quantidade, valorUnitario, desconto, valorTotal]
            );

            await db.query(
                `UPDATE partidas
                 SET vagas_bloqueadas = vagas_bloqueadas + ?
                 WHERE id = ?`,
                [quantidade, partidaId]
            );

            await db.commit();

            return res.status(201).json({
                id: result.insertId,
                status: 'Bloqueada',
                expira_em_minutos: 15,
                quantidade,
                valor_total: valorTotal
            });
        } catch (error) {
            await db.rollback();
            throw error;
        } finally {
            db.release();
        }
    }

    async confirmar(req, res) {
        const [rows] = await connection.query(
            `SELECT usuario_id FROM reservas_ingressos
             WHERE id = ? AND status = 'Bloqueada' AND expira_em > NOW()
             LIMIT 1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            throw notFound('Reserva bloqueada valida nao encontrada');
        }

        if (req.usuario.tipo_usuario !== 'Admin' && rows[0].usuario_id !== req.usuario.id) {
            throw forbidden('Acesso negado');
        }

        await connection.query(
            `UPDATE reservas_ingressos
             SET status = 'Confirmada'
             WHERE id = ?`,
            [req.params.id]
        );

        return res.json({ mensagem: 'Reserva confirmada' });
    }

    async cancelar(req, res) {
        const db = await connection.getConnection();

        try {
            await db.beginTransaction();

            const [rows] = await db.query(
                `SELECT * FROM reservas_ingressos
                 WHERE id = ? AND status IN ('Bloqueada', 'Confirmada')
                 FOR UPDATE`,
                [req.params.id]
            );

            if (rows.length === 0) {
                await db.rollback();
                throw notFound('Reserva ativa nao encontrada');
            }

            if (req.usuario.tipo_usuario !== 'Admin' && rows[0].usuario_id !== req.usuario.id) {
                await db.rollback();
                throw forbidden('Acesso negado');
            }

            await db.query(
                `UPDATE reservas_ingressos
                 SET status = 'Cancelada'
                 WHERE id = ?`,
                [req.params.id]
            );
            await db.query(
                `UPDATE partidas
                 SET vagas_bloqueadas = GREATEST(vagas_bloqueadas - ?, 0)
                 WHERE id = ?`,
                [rows[0].quantidade, rows[0].partida_id]
            );

            await db.commit();
            return res.json({ mensagem: 'Reserva cancelada e vagas liberadas' });
        } catch (error) {
            await db.rollback();
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = new ReservaController();
