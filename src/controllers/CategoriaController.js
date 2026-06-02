const connection = require('../config/database');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class CategoriaController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'nome', req.query.q || req.query.nome);

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT * FROM categorias
             ${where}
             ORDER BY nome ASC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM categorias ${where}`, valores);

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const [rows] = await connection.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            throw notFound('Categoria nao encontrada');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { nome } = req.body;

        if (!nome) {
            throw badRequest('nome e obrigatorio');
        }

        const [result] = await connection.query('INSERT INTO categorias (nome) VALUES (?)', [nome]);
        res.status(201).json({ id: result.insertId, nome });
    }

    async atualizar(req, res) {
        const { nome } = req.body;

        if (!nome) {
            throw badRequest('nome e obrigatorio');
        }

        const [result] = await connection.query('UPDATE categorias SET nome=? WHERE id=?', [nome, req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Categoria nao encontrada');
        }

        res.json({ mensagem: 'Categoria atualizada' });
    }

    async deletar(req, res) {
        const [result] = await connection.query('DELETE FROM categorias WHERE id=?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Categoria nao encontrada');
        }

        res.status(204).send();
    }
}

module.exports = new CategoriaController();
