const connection = require('../config/database');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class PlanoController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'nome_plano', req.query.q || req.query.nome);

        if (req.query.mensalidade_min) {
            filtros.push('mensalidade >= ?');
            valores.push(req.query.mensalidade_min);
        }
        if (req.query.mensalidade_max) {
            filtros.push('mensalidade <= ?');
            valores.push(req.query.mensalidade_max);
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT * FROM planos
             ${where}
             ORDER BY mensalidade ASC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM planos ${where}`, valores);

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const [rows] = await connection.query('SELECT * FROM planos WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            throw notFound('Plano nao encontrado');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { nome_plano, mensalidade, beneficios } = req.body;

        if (!nome_plano || mensalidade === undefined) {
            throw badRequest('nome_plano e mensalidade sao obrigatorios');
        }

        const [result] = await connection.query(
            `INSERT INTO planos (nome_plano, mensalidade, beneficios)
             VALUES (?, ?, ?)`,
            [nome_plano, mensalidade, beneficios]
        );

        res.status(201).json({ id: result.insertId, nome_plano, mensalidade, beneficios });
    }

    async atualizar(req, res) {
        const { nome_plano, mensalidade, beneficios } = req.body;
        const campos = [];
        const valores = [];

        if (nome_plano) {
            campos.push('nome_plano=?');
            valores.push(nome_plano);
        }
        if (mensalidade !== undefined) {
            campos.push('mensalidade=?');
            valores.push(mensalidade);
        }
        if (beneficios !== undefined) {
            campos.push('beneficios=?');
            valores.push(beneficios);
        }

        if (campos.length === 0) {
            throw badRequest('Informe ao menos um campo para atualizar');
        }

        valores.push(req.params.id);

        const [result] = await connection.query(`UPDATE planos SET ${campos.join(', ')} WHERE id=?`, valores);

        if (result.affectedRows === 0) {
            throw notFound('Plano nao encontrado');
        }

        res.json({ mensagem: 'Plano atualizado' });
    }

    async deletar(req, res) {
        const [result] = await connection.query('DELETE FROM planos WHERE id=?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Plano nao encontrado');
        }

        res.status(204).send();
    }
}

module.exports = new PlanoController();
