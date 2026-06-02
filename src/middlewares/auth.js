const jwt = require('../utils/jwt');
const { forbidden, unauthorized } = require('../utils/errors');

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
        return next(unauthorized('Token JWT nao informado'));
    }

    try {
        req.usuario = jwt.verify(token);
        return next();
    } catch (error) {
        return next(unauthorized('Token JWT invalido ou expirado'));
    }
}

function autorizar(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.tipo_usuario)) {
            return next(forbidden('Acesso negado'));
        }

        return next();
    };
}

module.exports = {
    autenticar,
    autorizar
};
