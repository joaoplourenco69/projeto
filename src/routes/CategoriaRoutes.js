const express = require('express');
const router = express.Router();
const CategoriaController = require('../controllers/CategoriaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { requiredString, validate, validateIdParam } = require('../middlewares/validate');

router.get('/categorias', CategoriaController.listar);
router.get('/categorias/:id', validateIdParam(), CategoriaController.buscar);
router.post(
    '/categorias',
    autenticar,
    autorizar('Admin'),
    validate((req) => [requiredString('nome', 'nome', 2)(req.body)]),
    CategoriaController.criar
);
router.put(
    '/categorias/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [requiredString('nome', 'nome', 2)(req.body)]),
    CategoriaController.atualizar
);
router.delete('/categorias/:id', autenticar, autorizar('Admin'), validateIdParam(), CategoriaController.deletar);

module.exports = router;
