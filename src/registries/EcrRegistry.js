'use strict';

const _ = require('lodash');
const ECR = require('aws-sdk').ECR;

const StandardRegistry = require('./StandardRegistry');

class EcrRegistry extends StandardRegistry {
    constructor(options) {
        super(options);
        const { accessKeyId, secretAccessKey, region } = options.credentials;
        this._ecr = new ECR({
            accessKeyId,
            secretAccessKey,
            region,
        });
    }

    async getCredentials() {
        const data = await this._refreshToken();
        const [username, password] = new Buffer(data.authorizationToken, 'base64')
            .toString()
            .split(':');
        return this._promise.resolve({
            username,
            password,
        });
    }

    async _refreshToken() {
        const token = await this._ecr
            .getAuthorizationToken()
            .promise();
        return _.first(token.authorizationData);
    }

    async getUrl() {
        const data = await this._refreshToken();
        return `${data.proxyEndpoint}/v2`;
    }
}

module.exports = EcrRegistry;
