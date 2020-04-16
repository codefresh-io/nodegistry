'use strict';

const defaultManifestType = 'application/vnd.docker.distribution.manifest.v2+json';

exports.Manifest = class {

    constructor(rawManifest) {
        this.raw = rawManifest;
        this._body = JSON.parse(rawManifest);

        if (this.mediaType !== defaultManifestType) {
            throw new Error(`Manifest media-type: "${this.type}" is not supported`);
        }
    }

    get mediaType() {
        return this._body.mediaType;
    }

    get configInformation() {
        return this._body.config;
    }
};

