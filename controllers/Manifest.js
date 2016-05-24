'use strict';

var url = require('url');


var Manifest = require('./ManifestService');


module.exports.apiV1ModelsGET = function apiV1ModelsGET (req, res, next) {
  Manifest.apiV1ModelsGET(req.swagger.params, res, next);
};

module.exports.apiV1ModelsModelIdGET = function apiV1ModelsModelIdGET (req, res, next) {
  Manifest.apiV1ModelsModelIdGET(req.swagger.params, res, next);
};

module.exports.manifestGET = function manifestGET (req, res, next) {
  Manifest.manifestGET(req.swagger.params, res, next);
};

module.exports.versionGET = function versionGET (req, res, next) {
  Manifest.versionGET(req.swagger.params, res, next);
};
