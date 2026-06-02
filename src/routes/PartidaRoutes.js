const express = require('express');
const router = express.Router();
const PartidaController = require('../controllers/PartidaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { atLeastOne, nonNegativeNumber, optionalString, requiredString, validate, validateIdParam } = require('../middlewares/validate');

router.get('/partidas', PartidaController.listar);
router.get('/partidas/:id', validateIdParam(), PartidaController.buscar);
router.post(
    '/partidas',
    autenticar,
    autorizar('Admin'),
    validate((req) => [
        requiredString('adversario', 'adversario', 2)(req.body),
        requiredString('data_hora', 'data_hora')(req.body),
        nonNegativeNumber('placar_spfc', 'placar_spfc', false)(req.body),
        nonNegativeNumber('placar_adv', 'placar_adv', false)(req.body)
    ]),
    PartidaController.criar
);
router.put(
    '/partidas/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        atLeastOne(['adversario', 'data_hora', 'local', 'placar_spfc', 'placar_adv'])(req.body),
        optionalString('adversario', 'adversario', 2)(req.body),
        nonNegativeNumber('placar_spfc', 'placar_spfc', false)(req.body),
        nonNegativeNumber('placar_adv', 'placar_adv', false)(req.body)
    ]),
    PartidaController.atualizar
);
router.delete('/partidas/:id', autenticar, autorizar('Admin'), validateIdParam(), PartidaController.deletar);

module.exports = router;
