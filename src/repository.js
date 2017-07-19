'use strict';

const { Manifest } = require('./manifest');

const DEFAULT_MANIFEST_TYPE = 'application/vnd.docker.distribution.manifest.v2+json';

exports.ImageRepository = class {

    constructor(options) {
        this._path = options.path;
        this._modem = options.modem;
    }

    getManifest(tag) {
        return this._modem.dial({
            method: 'GET',
            path: `/${this._path}/manifests/${tag}`,
            auth: {
                repository: this._path,
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

    putManifest(tag, manifest) {
        return this._modem.dial({
            method: 'PUT',
            path: `/${this._path}/manifests/${tag}`,
            auth: {
                repository: this._path,
                actions: ['push']
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

    getConfig(manifest) {
        const config = manifest.configInformation;

        return this._modem.dial({
            method: 'GET',
            path: `/${this._path}/blobs/${config.digest}`,
            auth: {
                repository: this._path,
                actions: ['pull']
            },
            headers: {
                'Accept': config.mediaType,
            },
            redirectCodes: [
                307
            ],
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
