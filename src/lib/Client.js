'use strict';

const _ = require('lodash');
const { createHash } = require('crypto');
const { RegistryModem } = require('./Modem');

const DEFAULT_MANIFEST_TYPE = ['application/vnd.docker.distribution.manifest.v2+json', 'application/vnd.oci.image.index.v1+json'];

exports.Client = class {
    constructor(options) {
        this._modem = new RegistryModem({
            promise: options.promise || Promise,
            clientId: options.clientId,
            credentials: options.credentials,

            request: options.request,
            registry: options.registry,
            ignoreRedirects: options.ignoreRedirects,
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

    getManifest(repository, reference, manifestType = DEFAULT_MANIFEST_TYPE) {
        return this._modem.dial({
            method: 'GET',
            path: `/${repository}/manifests/${reference}`,
            auth: {
                repository,
                actions: ['pull']
            },
            headers: {
                'Accept': manifestType
            },
            statusCodes: {
                200: true,
                401: 'Unauthorized operation',
                404: 'Image reference does not exist in repository',
                403: 'Forbidden operation'
            },
            returnRawResponse: true,
        })
            .then((response) => {
                const manifest = JSON.parse(response.body);
                if (_.get(response, 'headers.docker-content-digest')) {
                    _.set(manifest, 'config.repoDigest', response.headers['docker-content-digest']);
                } else {
                    // ECR doesn't return a docker-content-digest for
                    // application/vnd.oci.image.index.v1+json in the response headers.
                    // Probably there are some other providers that don't return it too.
                    const hash = createHash('sha256').update(response.body).digest('hex');
                    _.set(manifest, 'config.repoDigest', `sha256:${hash}`);
                }
                return manifest;
            });
    }

    putManifest(repository, reference, manifest) {
        if (!_.isString(manifest) && _.get(manifest, 'config.repoDigest')) {
            delete manifest.config.repoDigest;
        }
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
            payload: _.isString(manifest) ? manifest : JSON.stringify(manifest),
            statusCodes: {
                200: true,
                201: true,
                400: 'Manifest invalid',
                401: 'Unauthorized operation',
                403: 'Forbidden operation',
                404: 'Image reference does not exist in repository',
                405: 'Operation is not supported'
            },
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
                404: 'Image reference does not exist in repository',
                405: 'Operation is not supported'
            }
        });
    }

    getConfig(repository, manifest) {
        const config = manifest.config;

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

