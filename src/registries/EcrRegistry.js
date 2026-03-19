'use strict';

const { ECR } = require('aws-sdk');

const StandardRegistry = require('./StandardRegistry');

// region list is based on public AWS SDK data (partitions.regions in
// https://github.com/aws/aws-sdk-go/blob/v1.55.8/models/endpoints/endpoints.json)
const AWS_REGIONS = [
    'af-south-1',
    'ap-east-1',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-northeast-3',
    'ap-south-1',
    'ap-south-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-southeast-3',
    'ap-southeast-4',
    'ca-central-1',
    'ca-west-1',
    'eu-central-1',
    'eu-central-2',
    'eu-north-1',
    'eu-south-1',
    'eu-south-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'il-central-1',
    'me-central-1',
    'me-south-1',
    'sa-east-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'cn-north-1',
    'cn-northwest-1',
    'us-gov-east-1',
    'us-gov-west-1',
    'us-iso-east-1',
    'us-iso-west-1',
    'us-isob-east-1',
    'eu-isoe-west-1'
];

class EcrRegistry extends StandardRegistry {
    constructor(options) {
        super({
            ...options,
            ignoreRedirects: true,
        });
        const {
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region
        } = options.credentials || options;
        this._auth = null;
        if (options.validateAwsRegion && !this._validateAwsRegion(region)) {
            throw new Error(`Invalid AWS region: ${region}`);
        }
        this._ecr = new ECR({
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region,
        });
    }

    async getCredentials() {
        const auth = await this._refreshAuth();
        return auth.credentials;
    }

    async getUrl() {
        const auth = await this._refreshAuth();
        return `https://${auth.domain}/v2`;
    }

    async getDomain() {
        const auth = await this._refreshAuth();
        return auth.domain;
    }

    async _refreshAuth() {
        const tokenExpires = this._auth?.expiresAt ?? new Date(0);
        if (new Date() < tokenExpires) {
            return this._auth;
        }

        const token = await this._ecr
            .getAuthorizationToken()
            .promise();
        // eslint-disable-next-line no-unsafe-optional-chaining
        const { proxyEndpoint, authorizationToken, expiresAt } = token?.authorizationData[0];
        const domain = proxyEndpoint.substring('https://'.length);
        const [username, password] = Buffer.from(authorizationToken, 'base64')
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
        return this._auth;
    }

    _validateAwsRegion(region) {
        return AWS_REGIONS.includes(region);
    }
}

module.exports = EcrRegistry;

