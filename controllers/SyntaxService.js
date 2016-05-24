'use strict';

exports.apiV1ModelsModelIdSyntaxesGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = [ {
  "readOnly" : true,
  "id" : "aeiou"
} ];
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdSyntaxesSyntaxIdCheckPOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  * data (Filedata)
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

exports.apiV1ModelsModelIdSyntaxesSyntaxIdGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = {
  "readOnly" : true,
  "id" : "aeiou"
};
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdSyntaxesSyntaxIdModeGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = "aeiou";
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdSyntaxesSyntaxIdThemeGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = "aeiou";
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdSyntaxesSyntaxIdTranslateGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  * to (String)
  **/
  
  
  var examples = {};
  examples['application/json'] = {
  "readOnly" : true,
  "id" : "aeiou"
};
  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}

exports.apiV1ModelsModelIdSyntaxesSyntaxIdTranslatePOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  * syntaxId (String)
  * to (String)
  * data (Filedata)
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

