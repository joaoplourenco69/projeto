const connection = require('../config/database');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class NoticiaController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'n.titulo', req.query.q || req.query.titulo);

        if (req.query.categoria_id) {
            filtros.push('n.categoria_id = ?');
            valores.push(req.query.categoria_id);
        }
        if (req.query.categoria) {
            filtros.push('c.nome LIKE ?');
            valores.push(`%${String(req.query.categoria).trim()}%`);
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT n.*, c.nome AS categoria
             FROM noticias n
             INNER JOIN categorias c ON c.id = n.categoria_id
             ${where}
             ORDER BY n.data_publicacao DESC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM noticias n
             INNER JOIN categorias c ON c.id = n.categoria_id
             ${where}`,
            valores
        );

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const [rows] = await connection.query(
            `SELECT n.*, c.nome AS categoria
             FROM noticias n
             INNER JOIN categorias c ON c.id = n.categoria_id
             WHERE n.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            throw notFound('Noticia nao encontrada');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { titulo, conteudo, categoria_id, imagem_capa } = req.body;

        if (!titulo || !conteudo || !categoria_id) {
            throw badRequest('titulo, conteudo e categoria_id sao obrigatorios');
        }

        const [result] = await connection.query(
            `INSERT INTO noticias (titulo, conteudo, categoria_id, imagem_capa)
             VALUES (?, ?, ?, ?)`,
            [titulo, conteudo, categoria_id, imagem_capa]
        );

        res.status(201).json({ id: result.insertId, titulo, conteudo, categoria_id, imagem_capa });
    }

    async atualizar(req, res) {
        const { titulo, conteudo, categoria_id, imagem_capa } = req.body;
        const campos = [];
        const valores = [];

        if (titulo) {
            campos.push('titulo=?');
            valores.push(titulo);
        }
        if (conteudo) {
            campos.push('conteudo=?');
            valores.push(conteudo);
        }
        if (categoria_id) {
            campos.push('categoria_id=?');
            valores.push(categoria_id);
        }
        if (imagem_capa !== undefined) {
            campos.push('imagem_capa=?');
            valores.push(imagem_capa);
        }

        if (campos.length === 0) {
            throw badRequest('Informe ao menos um campo para atualizar');
        }

        valores.push(req.params.id);

        const [result] = await connection.query(`UPDATE noticias SET ${campos.join(', ')} WHERE id=?`, valores);

        if (result.affectedRows === 0) {
            throw notFound('Noticia nao encontrada');
        }

        res.json({ mensagem: 'Noticia atualizada' });
    }

    async deletar(req, res) {
        const [result] = await connection.query('DELETE FROM noticias WHERE id=?', [req.params.id]);

        if (result.affectedRows === 0) {
            throw notFound('Noticia nao encontrada');
        }

        res.status(204).send();
    }
}

module.exports = new NoticiaController();
