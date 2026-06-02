const connection = require('../config/database');
const Usuario = require('../models/Usuarios');
const { hashPassword } = require('../utils/password');
const { addLikeFilter, paginatedResponse, parsePagination } = require('../utils/listing');
const { badRequest, notFound } = require('../utils/errors');

class UsuarioController {
    async listar(req, res) {
        const { page, limit, offset } = parsePagination(req.query);
        const filtros = [];
        const valores = [];

        addLikeFilter(filtros, valores, 'nome', req.query.q || req.query.nome);
        addLikeFilter(filtros, valores, 'email', req.query.email);
        addLikeFilter(filtros, valores, 'cpf', req.query.cpf);

        if (req.query.tipo_usuario) {
            filtros.push('tipo_usuario = ?');
            valores.push(req.query.tipo_usuario);
        }

        const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
        const [rows] = await connection.query(
            `SELECT id, nome, email, cpf, tipo_usuario, criado_em
             FROM usuarios
             ${where}
             ORDER BY nome ASC
             LIMIT ? OFFSET ?`,
            [...valores, limit, offset]
        );
        const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM usuarios ${where}`, valores);

        res.json(paginatedResponse(rows, count.total, page, limit));
    }

    async buscar(req, res) {
        const id = parseInt(req.params.id);
        const [rows] = await connection.query(
            'SELECT id, nome, email, cpf, tipo_usuario, criado_em FROM usuarios WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            throw notFound('Usuario nao encontrado');
        }

        res.json(rows[0]);
    }

    async criar(req, res) {
        const { nome, email, senha, cpf, tipo_usuario = 'Socio' } = req.body;

        const [result] = await connection.query(
            `INSERT INTO usuarios (nome, email, senha, cpf, tipo_usuario)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, email, hashPassword(senha), cpf, tipo_usuario]
        );

        res.status(201).json(new Usuario(result.insertId, nome, email, cpf, tipo_usuario));
    }

    async atualizar(req, res) {
        const id = parseInt(req.params.id);
        const { nome, email, senha, cpf, tipo_usuario } = req.body;
        const campos = [];
        const valores = [];

        if (senha) {
            campos.push('senha=?');
            valores.push(hashPassword(senha));
        }
        if (nome) {
            campos.push('nome=?');
            valores.push(nome);
        }
        if (email) {
            campos.push('email=?');
            valores.push(email);
        }
        if (cpf) {
            campos.push('cpf=?');
            valores.push(cpf);
        }
        if (tipo_usuario) {
            campos.push('tipo_usuario=?');
            valores.push(tipo_usuario);
        }

        if (campos.length === 0) {
            throw badRequest('Informe ao menos um campo para atualizar');
        }

        valores.push(id);

        const [result] = await connection.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id=?`, valores);

        if (result.affectedRows === 0) {
            throw notFound('Usuario nao encontrado');
        }

        res.json({ mensagem: 'Usuario atualizado' });
    }

    async deletar(req, res) {
        const id = parseInt(req.params.id);
        const [result] = await connection.query('DELETE FROM usuarios WHERE id=?', [id]);

        if (result.affectedRows === 0) {
            throw notFound('Usuario nao encontrado');
        }

        res.status(204).send();
    }
}

module.exports = new UsuarioController();
