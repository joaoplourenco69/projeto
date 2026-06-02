const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { autenticar } = require('../middlewares/auth');
const {
    cpf,
    email,
    requiredString,
    validate
} = require('../middlewares/validate');

router.post(
    '/auth/register',
    validate((req) => [
        requiredString('nome', 'nome', 2)(req.body),
        email('email')(req.body),
        requiredString('senha', 'senha', 6)(req.body),
        cpf('cpf')(req.body)
    ]),
    AuthController.registrar
);
router.post(
    '/auth/login',
    validate((req) => [
        email('email')(req.body),
        requiredString('senha', 'senha', 1)(req.body)
    ]),
    AuthController.login
);
router.get('/auth/me', autenticar, AuthController.perfil);

module.exports = router;
