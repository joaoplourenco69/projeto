const { AppError } = require('../utils/errors');

function sendError(res, statusCode, code, message, details) {
    return res.status(statusCode).json({
        error: {
            code,
            message,
            ...(details !== undefined ? { details } : {})
        }
    });
}

function notFoundHandler(req, res) {
    return sendError(res, 404, 'ROUTE_NOT_FOUND', 'Rota nao encontrada');
}

function errorHandler(err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return sendError(res, 400, 'INVALID_JSON', 'JSON invalido no corpo da requisicao');
    }

    if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.code, err.message, err.details);
    }

    if (
        err.code === 'ER_ACCESS_DENIED_ERROR' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ER_BAD_DB_ERROR'
    ) {
        return sendError(
            res,
            503,
            'DATABASE_UNAVAILABLE',
            'Banco de dados indisponivel. Configure o arquivo .env com usuario/senha do MySQL e rode npm run db:setup.',
            process.env.NODE_ENV === 'production' ? undefined : err.message
        );
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, 409, 'DUPLICATE_ENTRY', 'Registro duplicado');
    }

    console.error(err);

    return sendError(
        res,
        500,
        'INTERNAL_ERROR',
        'Erro interno no servidor',
        process.env.NODE_ENV === 'production' ? undefined : err.message
    );
}

module.exports = {
    errorHandler,
    notFoundHandler,
    sendError
};
