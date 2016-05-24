'use strict';

var url = require('url');


var Operation = require('./OperationService');


module.exports.apiV1ModelsModelIdOperationsGET = function apiV1ModelsModelIdOperationsGET (req, res, next) {
  Operation.apiV1ModelsModelIdOperationsGET(req.swagger.params, res, next);
};

module.exports.apiV1ModelsModelIdOperationsOperationIdGET = function apiV1ModelsModelIdOperationsOperationIdGET (req, res, next) {
  Operation.apiV1ModelsModelIdOperationsOperationIdGET(req.swagger.params, res, next);
};

module.exports.apiV1ModelsModelIdOperationsOperationIdPOST = function apiV1ModelsModelIdOperationsOperationIdPOST (req, res, next) {
  Operation.apiV1ModelsModelIdOperationsOperationIdPOST(req.swagger.params, res, next);
};
