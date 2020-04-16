'use strict';

const _ = require('lodash');
const ECR = require('aws-sdk').ECR;

const StandardRegistry = require('./StandardRegistry');

class EcrRegistry extends StandardRegistry {
    constructor(options) {
        super(options);
        const { accessKeyId, secretAccessKey, region } = this.credentials;
        this._ecr = new ECR({
            accessKeyId,
            secretAccessKey,
            region,
        });
    }

    async getCredentials() {
        const token = await this._ecr
            .getAuthorizationToken()
            .promise();
        const data = _.first(token.authorizationData);
        const [username, password] = new Buffer(data.authorizationToken, 'base64')
            .toString()
            .split(':');
        return this._promise.resolve({
            host: data.proxyEndpoint.substring('https://'.length),
            username,
            password,
        });
    }
}

module.exports = EcrRegistry;
