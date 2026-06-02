const connection = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const jwt = require('../utils/jwt');
const { conflict, notFound, unauthorized } = require('../utils/errors');

function formatarUsuario(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        tipo_usuario: usuario.tipo_usuario
    };
}

class AuthController {
    async registrar(req, res) {
        const { nome, email, senha, cpf } = req.body;

        const [usuariosExistentes] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ? OR cpf = ? LIMIT 1',
            [email, cpf]
        );

        if (usuariosExistentes.length > 0) {
            throw conflict('Email ou CPF ja cadastrado');
        }

        const [result] = await connection.query(
            `INSERT INTO usuarios (nome, email, senha, cpf, tipo_usuario)
             VALUES (?, ?, ?, ?, 'Socio')`,
            [nome, email, hashPassword(senha), cpf]
        );

        const usuario = { id: result.insertId, nome, email, cpf, tipo_usuario: 'Socio' };
        const token = jwt.sign(usuario);

        return res.status(201).json({ usuario, token });
    }

    async login(req, res) {
        const { email, senha } = req.body;

        const [rows] = await connection.query(
            'SELECT id, nome, email, senha, cpf, tipo_usuario FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0 || !verifyPassword(senha, rows[0].senha)) {
            throw unauthorized('Email ou senha invalidos');
        }

        const usuario = formatarUsuario(rows[0]);
        const token = jwt.sign(usuario);

        return res.json({ usuario, token });
    }

    async perfil(req, res) {
        const [rows] = await connection.query(
            'SELECT id, nome, email, cpf, tipo_usuario FROM usuarios WHERE id = ? LIMIT 1',
            [req.usuario.id]
        );

        if (rows.length === 0) {
            throw notFound('Usuario nao encontrado');
        }

        return res.json(rows[0]);
    }
}

module.exports = new AuthController();
