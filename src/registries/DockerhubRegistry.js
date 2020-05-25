'use strict';

const StandardRegistry = require('./StandardRegistry');

class DockerhubRegistry extends StandardRegistry {
    constructor(options) {
        if (!options.request) {
            options.request = {};
        }
        options.request.host = 'index.docker.io';
        super(options);
    }

    getUrl() {
        return this._promise.resolve('https://index.docker.io/v2');
    }

    async getDomain() {
        return this._promise.resolve('docker.io');
    }
}

module.exports = DockerhubRegistry;
