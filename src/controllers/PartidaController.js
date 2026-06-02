const connection = require('../config/database');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class PartidaController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'adversario', req.query.q || req.query.adversario);
        addLikeFilter(filtros, valores, 'local', req.query.local);

        if (req.query.de) {
            filtros.push('data_hora >= ?');
            valores.push(req.query.de);
        }
        if (req.query.ate) {
            filtros.push('data_hora <= ?');
            valores.push(req.query.ate);
        }
        if (req.query.futuras === 'true') {
            filtros.push('data_hora > NOW()');
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT *,
                    GREATEST(capacidade_total - vagas_bloqueadas, 0) AS vagas_disponiveis
             FROM partidas
             ${where}
             ORDER BY data_hora ASC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM partidas ${where}`, valores);

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const [rows] = await connection.query('SELECT * FROM partidas WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            throw notFound('Partida nao encontrada');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { adversario, data_hora, local, placar_spfc = 0, placar_adv = 0 } = req.body;

        if (!adversario || !data_hora) {
            throw badRequest('adversario e data_hora sao obrigatorios');
        }

        const [result] = await connection.query(
            `INSERT INTO partidas (adversario, data_hora, local, placar_spfc, placar_adv)
             VALUES (?, ?, ?, ?, ?)`,
            [adversario, data_hora, local, placar_spfc, placar_adv]
        );

        res.status(201).json({ id: result.insertId, adversario, data_hora, local, placar_spfc, placar_adv });
    }

    async atualizar(req, res) {
        const { adversario, data_hora, local, placar_spfc, placar_adv } = req.body;
        const campos = [];
        const valores = [];

        if (adversario) {
            campos.push('adversario=?');
            valores.push(adversario);
        }
        if (data_hora) {
            campos.push('data_hora=?');
            valores.push(data_hora);
        }
        if (local !== undefined) {
            campos.push('local=?');
            valores.push(local);
        }
        if (placar_spfc !== undefined) {
            campos.push('placar_spfc=?');
            valores.push(placar_spfc);
        }
        if (placar_adv !== undefined) {
            campos.push('placar_adv=?');
            valores.push(placar_adv);
        }

        if (campos.length === 0) {
            throw badRequest('Informe ao menos um campo para atualizar');
        }

        valores.push(req.params.id);

        const [result] = await connection.query(`UPDATE partidas SET ${campos.join(', ')} WHERE id=?`, valores);

        if (result.affectedRows === 0) {
            throw notFound('Partida nao encontrada');
        }

        res.json({ mensagem: 'Partida atualizada' });
    }

    async deletar(req, res) {
        const [result] = await connection.query('DELETE FROM partidas WHERE id=?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Partida nao encontrada');
        }

        res.status(204).send();
    }
}

module.exports = new PartidaController();
