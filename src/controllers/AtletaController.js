const connection = require('../config/database');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class AtletaController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'nome', req.query.q || req.query.nome);
        addLikeFilter(filtros, valores, 'apelido', req.query.apelido);
        addLikeFilter(filtros, valores, 'posicao', req.query.posicao);
        addLikeFilter(filtros, valores, 'nacionalidade', req.query.nacionalidade);

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT * FROM atletas
             ${where}
             ORDER BY nome ASC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM atletas ${where}`, valores);

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const [rows] = await connection.query('SELECT * FROM atletas WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            throw notFound('Atleta nao encontrado');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { nome, apelido, posicao, nacionalidade, foto } = req.body;

        if (!nome) {
            throw badRequest('nome e obrigatorio');
        }

        const [result] = await connection.query(
            `INSERT INTO atletas (nome, apelido, posicao, nacionalidade, foto)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, apelido, posicao, nacionalidade, foto]
        );

        res.status(201).json({ id: result.insertId, nome, apelido, posicao, nacionalidade, foto });
    }

    async atualizar(req, res) {
        const { nome, apelido, posicao, nacionalidade, foto } = req.body;
        const campos = [];
        const valores = [];

        if (nome) {
            campos.push('nome=?');
            valores.push(nome);
        }
        if (apelido !== undefined) {
            campos.push('apelido=?');
            valores.push(apelido);
        }
        if (posicao !== undefined) {
            campos.push('posicao=?');
            valores.push(posicao);
        }
        if (nacionalidade !== undefined) {
            campos.push('nacionalidade=?');
            valores.push(nacionalidade);
        }
        if (foto !== undefined) {
            campos.push('foto=?');
            valores.push(foto);
        }

        if (campos.length === 0) {
            throw badRequest('Informe ao menos um campo para atualizar');
        }

        valores.push(req.params.id);

        const [result] = await connection.query(`UPDATE atletas SET ${campos.join(', ')} WHERE id=?`, valores);

        if (result.affectedRows === 0) {
            throw notFound('Atleta nao encontrado');
        }

        res.json({ mensagem: 'Atleta atualizado' });
    }

    async deletar(req, res) {
        const [result] = await connection.query('DELETE FROM atletas WHERE id=?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Atleta nao encontrado');
        }

        res.status(204).send();
    }
}

module.exports = new AtletaController();
