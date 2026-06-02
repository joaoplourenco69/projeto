const crypto = require('crypto');

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 8;

function base64UrlEncode(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function getSecret() {
    return process.env.JWT_SECRET || 'troque-este-segredo-em-producao';
}

function sign(payload, expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = { ...payload, iat: now, exp: now + expiresInSeconds };
    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
    const signature = crypto.createHmac('sha256', getSecret()).update(unsignedToken).digest('base64url');

    return `${unsignedToken}.${signature}`;
}

function verify(token) {
    const [encodedHeader, encodedBody, signature] = token.split('.');

    if (!encodedHeader || !encodedBody || !signature) {
        throw new Error('Token invalido');
    }

    const unsignedToken = `${encodedHeader}.${encodedBody}`;
    const expectedSignature = crypto.createHmac('sha256', getSecret()).update(unsignedToken).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
        throw new Error('Assinatura invalida');
    }

    const payload = base64UrlDecode(encodedBody);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
    }

    return payload;
}

module.exports = {
    sign,
    verify
};
