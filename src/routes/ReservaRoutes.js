const express = require('express');
const router = express.Router();
const ReservaController = require('../controllers/ReservaController');
const { autenticar, autorizar } = require('../middlewares/auth');
const { positiveInteger, validate, validateIdParam } = require('../middlewares/validate');

router.get('/reservas', autenticar, autorizar('Admin'), ReservaController.listar);
router.get('/reservas/minhas', autenticar, ReservaController.minhas);
router.post(
    '/partidas/:partidaId/reservas',
    autenticar,
    validateIdParam('partidaId'),
    validate((req) => [
        positiveInteger('quantidade', 'quantidade', false)(req.body)
    ]),
    ReservaController.criar
);
router.patch('/reservas/:id/confirmar', autenticar, validateIdParam(), ReservaController.confirmar);
router.patch('/reservas/:id/cancelar', autenticar, validateIdParam(), ReservaController.cancelar);

module.exports = router;
