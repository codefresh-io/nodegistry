'use strict';

const StandardRegistry = require('./StandardRegistry');
const DockerhubRegistry = require('./DockerhubRegistry');
const EcrRegistry = require('./EcrRegistry');
const GcrRegistry = require('./GcrRegistry');

module.exports = {
    StandardRegistry,
    DockerhubRegistry,
    EcrRegistry,
    GcrRegistry,
};
