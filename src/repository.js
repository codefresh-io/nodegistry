'use strict';

const DEFAULT_MANIFEST_TYPE = 'vnd.docker.distribution.manifest.v2';

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
                'Accept': `application/${DEFAULT_MANIFEST_TYPE}+json`
            },
            statusCodes: {
                200: true,
                401: 'Unauthorized operation',
                403: 'Forbidden operation'
            }
        })
            .then((rawManifest) => {
                return {
                    type: DEFAULT_MANIFEST_TYPE,
                    raw: rawManifest
                };
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
                'Content-Type': `application/${manifest.type}+json`,
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
};
