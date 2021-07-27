'use strict';

const _ = require('lodash');
const StandardRegistry = require('./StandardRegistry');
const qs = require('querystring');
const request = require('requestretry');
const jwt = require('jsonwebtoken');

const MANAGED_IDENTITY_URL = 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/';
const ACR_DOCKER_USERNAME = '00000000-0000-0000-0000-000000000000';

class AcrRegistry extends StandardRegistry {
    constructor(options) {
        super(options);
        const { clientId, clientSecret, domain } = options.credentials || options;
        this._credentials = { clientId, clientSecret, domain };
        this._auth = null;
    }

    async getCredentials() {
        const auth = await this._refreshAuth();
        return auth.credentials;
    }

    async getDomain() {
        const auth = await this._refreshAuth();
        return auth.domain;
    }

    _getManagedIdentityURL(clientId) {
        if (clientId) {
            return `${MANAGED_IDENTITY_URL}&client_id=${clientId}`;
        }
        return MANAGED_IDENTITY_URL;
    }

    async getCredentialsFromManagedIdentity(clientId) {
        const managedIdentityURL = this._getManagedIdentityURL(clientId);
        const options = {
            method: 'GET',
            json: true,
            headers: {
                Metadata: true
            },
            uri: managedIdentityURL
        };
        return request(options);
    }

    async _exchangeTokenToRefreshToken(service, credentials) {
        const exchangeEndpoint = `https://${service}/oauth2/exchange`;

        const reqBody = qs.stringify({
            grant_type: 'access_token',
            service,
            access_token: _.get(credentials, 'access_token'),
        });

        const options = {
            method: 'POST',
            uri: exchangeEndpoint,
            headers: {
                'Content-Length': reqBody.length,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: reqBody,
            resolveWithFullResponse: true,
        };

        const exchangeResponse = await request(options);
        const exchangeResponseData = JSON.parse(exchangeResponse.body);

        // Now we have a refresh_token to used against token endpoint
        // to get a valid ACR-specific token
        return exchangeResponseData.refresh_token;
    }

    async _getCredentialsUsingMI() {
        const credentials = await this.getCredentialsFromManagedIdentity(_.get(this, '_credentials.clientId'));
        const authorizationToken = await this._exchangeTokenToRefreshToken(this._credentials.domain, credentials);
        const { exp } = jwt.decode(authorizationToken);
        return {
            domain: this._credentials.domain,
            expiresAt: new Date(exp * 1000),
            credentials: {
                username: ACR_DOCKER_USERNAME,
                password: authorizationToken
            }
        };
    }

    async _getCredentialsUsingSP() {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);
        return {
            domain: this._credentials.domain,
            expiresAt,
            credentials: {
                username: _.get(this, '_credentials.clientId'),
                password: _.get(this, '_credentials.clientSecret')
            }
        };
    }

    async _refreshAuth() {
        const tokenExpires = _.get(this, '_auth.expiresAt', new Date(0));
        if (new Date() < tokenExpires) {
            return this._auth;
        }

        if (_.get(this, '_credentials.clientSecret') && _.get(this, '_credentials.clientId')) {
            this._auth = await this._getCredentialsUsingSP();
        } else {
            this._auth = await this._getCredentialsUsingMI();
        }
        return this._auth;
    }
}

module.exports = AcrRegistry;