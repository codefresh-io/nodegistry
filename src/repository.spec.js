'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

const { ImageRepository } = require('./repository');

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;
const { match } = sinon;

describe('Image Repository -', () => {

    let imageRepository;

    let dialStub;

    beforeEach(() => {
        dialStub = sinon.stub();

        imageRepository = new ImageRepository({
            path: 'image/path',
            modem: {
                dial: dialStub
            }
        });
    });

    describe('Retrieving manifest', () => {

        beforeEach(() => {
            dialStub.withArgs({
                method: 'GET',
                path: '/image/path/manifests/tag',
                auth: {
                    repository: 'image/path',
                    actions: ['pull']
                },
                headers: {
                    'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
                },
                statusCodes: match.any
            })
                .resolves('raw manifest');
        });

        it('should return a manifest object with the raw manifest', () => {
            const manifest = imageRepository.getManifest('tag');

            return expect(manifest).to.eventually.have.property('raw', 'raw manifest');
        });

        it('should return a manifest object with the type of the manifest', () => {
            const manifest = imageRepository.getManifest('tag');

            return expect(manifest).to.eventually.have.property('type', 'vnd.docker.distribution.manifest.v2');
        });

    });

    describe('Put manifest', () => {
        beforeEach(() => {
            dialStub.resolves();
        });

        it('should dial to the registry', () => {
            return imageRepository
                .putManifest('new-tag', {
                    type: 'some-type-of-manifest',
                    raw: 'this is the manifest'
                })
                .then(() => expect(dialStub).to.have.been.calledWithMatch({
                    method: 'PUT',
                    path: '/image/path/manifests/new-tag',
                    auth: {
                        repository: 'image/path',
                        actions: ['push']
                    },
                    headers: {
                        'Content-Type': 'application/some-type-of-manifest+json'
                    },
                    payload: 'this is the manifest',
                    statusCodes: match.any
                }));
        })
    });

});
