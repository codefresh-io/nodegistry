'use strict';

const _ = require('lodash');
const ECR = require('aws-sdk').ECR;

const StandardRegistry = require('./StandardRegistry');

class EcrRegistry extends StandardRegistry {
    constructor(options) {
        super(options);
        const { accessKeyId, secretAccessKey, region } = options.credentials;
        this._auth = null;
        this._ecr = new ECR({
            accessKeyId,
            secretAccessKey,
            region,
        });
    }

    async getCredentials() {
        const auth = await this._refreshAuth();
        return this._promise.resolve(auth.credentials);
    }

    async getUrl() {
        const auth = await this._refreshAuth();
        return this._promise.resolve(`https://${auth.domain}/v2`);
    }

    async getDomain() {
        const auth = await this._refreshAuth();
        return this._promise.resolve(auth.domain);
    }

    async _refreshAuth() {
        const tokenExpires = _.get(this, '_auth.expiresAt', new Date(0));
        if (new Date() < tokenExpires) {
            return this._promise.resolve(this._auth);
        }

        const token = await this._ecr
            .getAuthorizationToken()
            .promise();
        const { proxyEndpoint, authorizationToken, expiresAt } = _.first(token.authorizationData);
        const domain = proxyEndpoint.substring('https://'.length);
        const [username, password] = new Buffer(authorizationToken, 'base64')
            .toString()
            .split(':');
        this._auth = {
            domain,
            expiresAt,
            credentials: {
                username,
                password,
            },
        };
        return this._promise.resolve(this._auth);
    }
}

module.exports = EcrRegistry;
