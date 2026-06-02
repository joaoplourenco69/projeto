const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { autenticar, autorizar } = require('../middlewares/auth');
const {
    atLeastOne,
    cpf,
    email,
    oneOf,
    optionalCpf,
    optionalEmail,
    optionalString,
    requiredString,
    validate,
    validateIdParam
} = require('../middlewares/validate');

const perfis = ['Admin', 'Socio'];

router.get('/usuarios', autenticar, autorizar('Admin'), UsuarioController.listar);
router.get('/usuarios/:id', autenticar, autorizar('Admin'), validateIdParam(), UsuarioController.buscar);
router.post(
    '/usuarios',
    autenticar,
    autorizar('Admin'),
    validate((req) => [
        requiredString('nome', 'nome', 2)(req.body),
        email('email')(req.body),
        requiredString('senha', 'senha', 6)(req.body),
        cpf('cpf')(req.body),
        oneOf('tipo_usuario', perfis, false)(req.body)
    ]),
    UsuarioController.criar
);
router.put(
    '/usuarios/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        atLeastOne(['nome', 'email', 'senha', 'cpf', 'tipo_usuario'])(req.body),
        optionalString('nome', 'nome', 2)(req.body),
        optionalEmail('email')(req.body),
        optionalString('senha', 'senha', 6)(req.body),
        optionalCpf('cpf')(req.body),
        oneOf('tipo_usuario', perfis, false)(req.body)
    ]),
    UsuarioController.atualizar
);
router.delete('/usuarios/:id', autenticar, autorizar('Admin'), validateIdParam(), UsuarioController.deletar);

module.exports = router;
