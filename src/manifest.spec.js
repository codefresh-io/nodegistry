'use strict';

const { expect } = require('chai');

const Registry                   = require('../');

describe('Manifest', () => {

    const options = {
        'default': true,
        'name': 'dockerhub',
        '_protocol': 'https',
        '_credentials': { 'username': process.env.DOCKERHUB_USERNAME, 'password': process.env.DOCKERHUB_PASSWORD },
        '_domain': 'registry.hub.docker.com',
    };

    it('pull + push', async () => {

        const repositoryURL = process.env.DOCKERHUB_REPOSITORY || 'pashacodefresh/cftestreporter';
        const registry = new Registry({
            promise: Promise,
            url: `${options._protocol}://${options._domain}/v2`,
            credentials: {
                username: options._credentials.username,
                password: options._credentials.password,
            },
        });

        const tag = process.env.DOCKERHUB_TAG;
        const tagForPush = 'pushTag';

        const repository = await registry.getRepository(repositoryURL);

        let manifest;
        try {
            manifest = await repository.getManifest(tag);
        } catch (e) {
            console.error(e);
            expect(true).to.equal(false);
        }

        try {
            await repository.putManifest(tagForPush, manifest);

            manifest = await repository.getManifest(tagForPush);

            expect(manifest).to.not.be.null;
        } catch (e) {
            expect(true).to.equal(false);
        }
    }).timeout(10000);

});

