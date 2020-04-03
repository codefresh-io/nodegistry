'use strict';

const { RegistryModem } = require('./modem');
const { ImageRepository } = require('./repository');

exports.Registry = class {

    constructor(options) {
        this._modem = new RegistryModem({
            promise: Promise,
            clientId: options.clientId,
            auth: options.auth,
            credentials: options.credentials,

            url: options.url,
            protocol: options.protocol,
            host: options.host,
            port: options.port,
            version: options.version
        });
    }

    getRepository(path) {
        return new ImageRepository({
            path,
            modem: this._modem
        });
    }
};

