const express = require('express');
const router = express.Router();
const NoticiaController = require('../controllers/NoticiaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { atLeastOne, optionalString, positiveInteger, requiredString, validate, validateIdParam } = require('../middlewares/validate');

router.get('/noticias', NoticiaController.listar);
router.get('/noticias/:id', validateIdParam(), NoticiaController.buscar);
router.post(
    '/noticias',
    autenticar,
    autorizar('Admin'),
    validate((req) => [
        requiredString('titulo', 'titulo', 3)(req.body),
        requiredString('conteudo', 'conteudo', 10)(req.body),
        positiveInteger('categoria_id', 'categoria_id')(req.body)
    ]),
    NoticiaController.criar
);
router.put(
    '/noticias/:id',
    autenticar,
    autorizar('Admin'),
    validateIdParam(),
    validate((req) => [
        atLeastOne(['titulo', 'conteudo', 'categoria_id', 'imagem_capa'])(req.body),
        optionalString('titulo', 'titulo', 3)(req.body),
        optionalString('conteudo', 'conteudo', 10)(req.body),
        positiveInteger('categoria_id', 'categoria_id', false)(req.body)
    ]),
    NoticiaController.atualizar
);
router.delete('/noticias/:id', autenticar, autorizar('Admin'), validateIdParam(), NoticiaController.deletar);

module.exports = router;
