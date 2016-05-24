'use strict';

exports.apiV1ModelsModelIdOperationsGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = [ {
  "name" : "aeiou",
  "description" : "aeiou",
  "id" : "aeiou",
  "type" : "aeiou",
  "config" : {
    "filter" : "aeiou"
  }
} ];
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdOperationsOperationIdGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * operationId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = {
  "name" : "aeiou",
  "description" : "aeiou",
  "id" : "aeiou",
  "type" : "aeiou",
  "config" : {
    "filter" : "aeiou"
  }
};
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdOperationsOperationIdPOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * operationId (String)
  * data (List)
  **/
  
  
  var examples = {};
  examples['application/json'] = {
  "data" : "aeiou",
  "annotations" : [ {
    "severity" : "aeiou",
    "line" : "",
    "column" : "",
    "message" : "aeiou"
  } ],
  "message" : "aeiou",
  "status" : "aeiou"
};
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

