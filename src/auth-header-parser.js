'use strict';

const AUTHENTICATION_HEADER_PREFIX = 'Bearer ';
const AUTHENTICATION_HEADER_REGEX = /^Bearer (?:[a-zA-Z]*)="(?:[^"]*)"(?:,(?:[a-zA-Z]*)="(?:[^"]*)")*$/;

exports.parseAuthenticationHeader = (header) => {
    if (!header.startsWith(AUTHENTICATION_HEADER_PREFIX)) {
        throw new Error(`Authentication string must start with "${AUTHENTICATION_HEADER_PREFIX.trim()}"`);
    }

    if (!AUTHENTICATION_HEADER_REGEX.test(header)) {
        throw new Error('Authentication string is invalid');
    }

    const regex = /([a-z]*)="([^"]*)"(?:,|$)/ig;
    regex.lastIndex = AUTHENTICATION_HEADER_PREFIX.length;
    const result = {};


    for (let regexResult = regex.exec(header); regexResult; regexResult = regex.exec(header)) {
        result[regexResult[1]] = regexResult[2];
    }

    return result;
};
