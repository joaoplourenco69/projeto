const express = require('express');
const router = express.Router();
const PlanoController = require('../controllers/PlanoController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { atLeastOne, nonNegativeNumber, optionalString, requiredString, validate, validateIdParam } = require('../middlewares/validate');

router.get('/planos', PlanoController.listar);
router.get('/planos/:id', validateIdParam(), PlanoController.buscar);
router.post(
    '/planos',
    autenticar,
    autorizar('Admin'),
    validate((req) => [
        requiredString('nome_plano', 'nome_plano', 2)(req.body),
        nonNegativeNumber('mensalidade', 'mensalidade')(req.body)
    ]),
    PlanoController.criar
);
router.put(
    '/planos/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        atLeastOne(['nome_plano', 'mensalidade', 'beneficios'])(req.body),
        optionalString('nome_plano', 'nome_plano', 2)(req.body),
        nonNegativeNumber('mensalidade', 'mensalidade', false)(req.body)
    ]),
    PlanoController.atualizar
);
router.delete('/planos/:id', autenticar, autorizar('Admin'), validateIdParam(), PlanoController.deletar);

module.exports = router;
