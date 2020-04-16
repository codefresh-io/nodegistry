'use strict';

const _ = require('lodash');

const StandardRegistry = require('./StandardRegistry');

class DockerhubRegistry extends StandardRegistry {
    constructor(options) {
        if (!options.request) {
            options.request = {};
        }
        options.request.host = 'index.docker.io';
        super(options);
    }
}

module.exports = DockerhubRegistry;
