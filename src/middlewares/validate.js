const { badRequest } = require('../utils/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF_REGEX = /^\d{11}$/;
const CEP_REGEX = /^\d{8}$/;

function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function addError(errors, field, message) {
    errors.push({ field, message });
}

function validate(rules) {
    return (req, res, next) => {
        const errors = [];

        rules(req).forEach((rule) => {
            rule(errors);
        });

        if (errors.length > 0) {
            return next(badRequest('Dados invalidos', errors));
        }

        return next();
    };
}

function validateIdParam(paramName = 'id') {
    return validate((req) => [
        (errors) => {
            const value = Number(req.params[paramName]);
            if (!Number.isInteger(value) || value <= 0) {
                addError(errors, paramName, 'deve ser um numero inteiro positivo');
            }
        }
    ]);
}

function requiredString(field, label = field, minLength = 1) {
    return (source) => (errors) => {
        const value = source[field];
        if (isBlank(value)) {
            return addError(errors, field, `${label} e obrigatorio`);
        }
        if (String(value).trim().length < minLength) {
            return addError(errors, field, `${label} deve ter pelo menos ${minLength} caracteres`);
        }
    };
}

function optionalString(field, label = field, minLength = 1) {
    return (source) => (errors) => {
        const value = source[field];
        if (value !== undefined && value !== null && String(value).trim().length < minLength) {
            addError(errors, field, `${label} deve ter pelo menos ${minLength} caracteres`);
        }
    };
}

function email(field = 'email') {
    return (source) => (errors) => {
        if (!EMAIL_REGEX.test(String(source[field] || '').trim())) {
            addError(errors, field, 'deve ser um email valido');
        }
    };
}

function optionalEmail(field = 'email') {
    return (source) => (errors) => {
        if (!isBlank(source[field]) && !EMAIL_REGEX.test(String(source[field]).trim())) {
            addError(errors, field, 'deve ser um email valido');
        }
    };
}

function cpf(field = 'cpf') {
    return (source) => (errors) => {
        const value = normalizeDigits(source[field]);
        if (!CPF_REGEX.test(value)) {
            addError(errors, field, 'deve conter 11 digitos');
        }
        source[field] = value;
    };
}

function optionalCpf(field = 'cpf') {
    return (source) => (errors) => {
        if (!isBlank(source[field])) {
            const value = normalizeDigits(source[field]);
            if (!CPF_REGEX.test(value)) {
                addError(errors, field, 'deve conter 11 digitos');
            }
            source[field] = value;
        }
    };
}

function positiveInteger(field, label = field, required = true) {
    return (source) => (errors) => {
        if (!required && isBlank(source[field])) {
            return;
        }

        const value = Number(source[field]);
        if (!Number.isInteger(value) || value <= 0) {
            addError(errors, field, `${label} deve ser um numero inteiro positivo`);
            return;
        }
        source[field] = value;
    };
}

function nonNegativeNumber(field, label = field, required = true) {
    return (source) => (errors) => {
        if (!required && isBlank(source[field])) {
            return;
        }

        const value = Number(source[field]);
        if (!Number.isFinite(value) || value < 0) {
            addError(errors, field, `${label} deve ser um numero maior ou igual a zero`);
            return;
        }
        source[field] = value;
    };
}

function oneOf(field, allowed, required = true) {
    return (source) => (errors) => {
        if (!required && isBlank(source[field])) {
            return;
        }
        if (!allowed.includes(source[field])) {
            addError(errors, field, `deve ser um dos valores: ${allowed.join(', ')}`);
        }
    };
}

function cep(field = 'cep') {
    return (source) => (errors) => {
        const value = normalizeDigits(source[field]);
        if (!CEP_REGEX.test(value)) {
            addError(errors, field, 'deve conter 8 digitos');
        }
        source[field] = value;
    };
}

function atLeastOne(fields) {
    return (source) => (errors) => {
        if (!fields.some((field) => !isBlank(source[field]))) {
            addError(errors, 'body', `informe ao menos um campo: ${fields.join(', ')}`);
        }
    };
}

module.exports = {
    atLeastOne,
    cep,
    cpf,
    email,
    nonNegativeNumber,
    oneOf,
    optionalCpf,
    optionalEmail,
    optionalString,
    positiveInteger,
    requiredString,
    validate,
    validateIdParam
};
