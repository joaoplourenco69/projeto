const express = require('express');
const router = express.Router();
const AssinaturaController = require('../controllers/AssinaturaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const {
    cep,
    oneOf,
    positiveInteger,
    requiredString,
    validate,
    validateIdParam
} = require('../middlewares/validate');

router.get(
    '/enderecos/cep/:cep',
    autenticar,
    validate((req) => [cep('cep')(req.params)]),
    AssinaturaController.consultarCep
);
router.get('/assinaturas', autenticar, autorizar('Admin'), AssinaturaController.listar);
router.get('/assinaturas/minhas', autenticar, AssinaturaController.minhas);
router.post(
    '/assinaturas',
    autenticar,
    validate((req) => [
        positiveInteger('plano_id', 'plano_id')(req.body),
        positiveInteger('usuario_id', 'usuario_id', false)(req.body),
        cep('cep')(req.body),
        requiredString('numero', 'numero')(req.body),
        oneOf('forma_pagamento', ['pix', 'cartao', 'boleto'], false)(req.body)
    ]),
    AssinaturaController.criar
);
router.patch(
    '/assinaturas/:id/aprovar',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        oneOf('pagamento_status', ['Aprovado', 'Recusado'], false)(req.body)
    ]),
    AssinaturaController.aprovar
);
router.patch('/assinaturas/:id/cancelar', autenticar, validateIdParam(), AssinaturaController.cancelar);

module.exports = router;
