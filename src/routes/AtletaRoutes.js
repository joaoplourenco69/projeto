const express = require('express');
const router = express.Router();
const AtletaController = require('../controllers/AtletaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { atLeastOne, optionalString, requiredString, validate, validateIdParam } = require('../middlewares/validate');

router.get('/atletas', AtletaController.listar);
router.get('/atletas/:id', validateIdParam(), AtletaController.buscar);
router.post(
    '/atletas',
    autenticar,
    autorizar('Admin'),
    validate((req) => [requiredString('nome', 'nome', 2)(req.body)]),
    AtletaController.criar
);
router.put(
    '/atletas/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        atLeastOne(['nome', 'apelido', 'posicao', 'nacionalidade', 'foto'])(req.body),
        optionalString('nome', 'nome', 2)(req.body)
    ]),
    AtletaController.atualizar
);
router.delete('/atletas/:id', autenticar, autorizar('Admin'), validateIdParam(), AtletaController.deletar);

module.exports = router;
