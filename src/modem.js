'use strict';

const request = require('request');
const os = require('os');

const { parseAuthenticationHeader } = require('./auth-header-parser');
const { buildUrl } = require('./url-builder');

const AUTHENTICATION_HEADER_NAME = 'www-authenticate';

const OK_STATUS_CODE = 200;
const UNAUTHORIZED_STATUS_CODE = 401;


exports.RegistryModem = class {

    constructor(options) {
        this._promise = options.promise || Promise;
        this.clientId = options.clientId || os.hostname();
        this._auth = options.auth;

        this._request = request.defaults({
            baseUrl: buildUrl(options)
        });

        if (typeof options.credentials === 'function') {
            const credentialsFunction = options.credentials;
            this._getCredentials = () => this._promise.resolve(credentialsFunction());
        } else {
            this._getCredentials = () => this._promise.resolve(options.credentials);
        }

        this._authenticationInfoPromise = undefined;
    }

    dial(options) {
        const statusCodes = options.statusCodes;
        const requestOptions = {
            method: options.method,
            url: options.path,
            qs: options.parameters,
            headers: options.headers,
            body: options.payload
        };

        let authPromise;
        if (options.auth) {
            authPromise = this._promise.all([
                this._retrieveAuthenticationInfo(),
                this._getCredentials(),
            ])
                .then(([authInfo, credentials]) => {
                    if (authInfo.realm === 'basic') {
                        requestOptions.auth = credentials;
                        return this._promise.resolve();
                    }
                    return this._retrieveAuthenticationToken(
                        authInfo,
                        credentials,
                        options.auth.repository,
                        options.auth.actions,
                    )
                        .then((token) => {
                            if (token) {
                                requestOptions.auth = {
                                    bearer: token,
                                };
                            }
                        });
                });
        } else {
            authPromise = this._promise.resolve();
        }

        return authPromise
            .then(() => new this._promise((resolve, reject) => {
                this._request(requestOptions, (err, response, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve([response, body]);
                    }
                });
            }))
            .then(([response, body]) => {
                const currentStatus = statusCodes[response.statusCode];
                if (currentStatus === true) {
                    return body;
                } else {
                    throw new Error(currentStatus || 'Unknown error');
                }
            });
    }

    _retrieveAuthenticationToken(authInfo, credentials, repository, actions) {
        if (!authInfo) {
            return undefined;
        }
        return this._promise.resolve()
            .then(() => {
                return new this._promise((resolve, reject) => {
                    request({
                        url: authInfo.realm,
                        qs: {
                            scope: `repository:${repository}:${actions.join(',')}`,
                            service: authInfo.service,
                            client_id: this.clientId
                        },
                        auth: credentials,
                        json: true
                    }, (err, response, body) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve([response, body]);
                        }
                    });
                })
                    .then(([response, body]) => {
                        if (response.statusCode !== OK_STATUS_CODE) {
                            const message = body.details || (body.errors && body.errors.length && body.errors[0].message) || 'Unknown Error';
                            throw new Error(`Failed retrieving token: ${message}`);
                        }

                        return body.token || body.access_token;
                    });
            });
    }

    _retrieveAuthenticationInfo() {
        if (!this._authenticationInfoPromise) {
            this._authenticationInfoPromise = new this._promise((resolve, reject) => {
                this._request({
                    url: '/',
                    json: true
                }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            })
                .then((response) => {
                    switch (response.statusCode) {
                        case OK_STATUS_CODE:
                            return undefined;
                        case UNAUTHORIZED_STATUS_CODE: {
                            const authHeader = response.headers[AUTHENTICATION_HEADER_NAME];
                            return parseAuthenticationHeader(authHeader);
                        }
                        default:
                            throw new Error(`Unknown status code ${response.statusCode} on ` +
                                             'getting authentication information');
                    }
                });
        }

        return this._authenticationInfoPromise;
    }
};
