'use strict';

const { RegistryModem } = require('./Modem');
const { Manifest } = require('./Manifest');

const DEFAULT_MANIFEST_TYPE = 'application/vnd.docker.distribution.manifest.v2+json';

exports.Client = class {
    constructor(options) {
        this._modem = new RegistryModem({
            promise: options.promise || Promise,
            clientId: options.clientId,
            credentials: options.credentials,

            request: options.request,
            registry: options.registry,
        });
    }

    ping() {
        return this._modem.dial({
            method: 'GET',
            path: '/',
            auth: {},
            statusCodes: {
                200: true,
                401: 'Unauthorized operation',
                403: 'Forbidden operation',
            },
        });
    }

    getManifest(repository, reference) {
        return this._modem.dial({
            method: 'GET',
            path: `/${repository}/manifests/${reference}`,
            auth: {
                repository,
                actions: ['pull']
            },
            headers: {
                'Accept': DEFAULT_MANIFEST_TYPE
            },
            statusCodes: {
                200: true,
                401: 'Unauthorized operation',
                403: 'Forbidden operation'
            }
        })
            .then((rawManifest) => {
                return new Manifest(rawManifest);
            });
    }

    putManifest(repository, reference, manifest) {
        return this._modem.dial({
            method: 'PUT',
            path: `/${repository}/manifests/${reference}`,
            auth: {
                repository,
                actions: ['pull', 'push']
            },
            headers: {
                'Content-Type': manifest.mediaType,
            },
            payload: manifest.raw,
            statusCodes: {
                200: true,
                201: true,
                400: 'Manifest invalid',
                401: 'Unauthorized operation',
                403: 'Forbidden operation',
                405: 'Operation is not supported'
            }
        });
    }

    deleteManifest(repository, reference) {
        return this._modem.dial({
            method: 'DELETE',
            path: `/${repository}/manifests/${reference}`,
            auth: {
                repository,
                actions: ['push']
            },
            statusCodes: {
                200: true,
                201: true,
                202: true,
                400: 'Manifest invalid',
                401: 'Unauthorized operation',
                403: 'Forbidden operation',
                405: 'Operation is not supported'
            }
        });
    }

    getConfig(repository, manifest) {
        const config = manifest.configInformation;

        return this._modem.dial({
            method: 'GET',
            path: `/${repository}/blobs/${config.digest}`,
            auth: {
                repository,
                actions: ['pull']
            },
            headers: {
                'Accept': config.mediaType,
            },
            statusCodes: {
                200: true,
                400: 'Manifest invalid',
                401: 'Unauthorized operation',
                403: 'Forbidden operation',
                404: 'Configuration not found'
            }
        })
            .then(JSON.parse);
    }
};

