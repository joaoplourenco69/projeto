class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

function badRequest(message, details) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
}

function unauthorized(message = 'Nao autenticado') {
    return new AppError(message, 401, 'UNAUTHORIZED');
}

function forbidden(message = 'Acesso negado') {
    return new AppError(message, 403, 'FORBIDDEN');
}

function notFound(message = 'Recurso nao encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
}

function conflict(message, details) {
    return new AppError(message, 409, 'CONFLICT', details);
}

module.exports = {
    AppError,
    badRequest,
    conflict,
    forbidden,
    notFound,
    unauthorized
};
