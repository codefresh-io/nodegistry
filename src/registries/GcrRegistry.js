'use strict';

const googleAuth = require('google-auto-auth');
const Promise = require('bluebird');

const StandardRegistry = require('./StandardRegistry');

class GcrRegistry extends StandardRegistry {
    constructor(options) {
        super(options);
        const { keyFilePath, client_email, private_key } = this.credentials;

        if (keyFilePath) {
            this._googleAuth = googleAuth({
                keyFilename: keyFilePath,
                scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
            });
        } else {
            this._googleAuth = googleAuth({
                credentials: {
                    client_email,
                    private_key,
                },
                scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
            });
        }
    }

    async getCredentials() {
        const token = await Promise.fromCallback(cb => this._googleAuth.getToken(cb));
        return this._promise.resolve({
            username: 'oauth2accesstoken',
            password: token,
        });
    }

    getProjectId() {
        const promise = Promise.fromCallback(cb => this._googleAuth.getProjectId(cb));
        return this._promise.resolve(promise);
    }
}

module.exports = GcrRegistry;
