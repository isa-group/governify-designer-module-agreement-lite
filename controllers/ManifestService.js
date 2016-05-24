'use strict';

var manifest = require('./loadManifest.js').load('api/manifest.yaml');
var moduleInfo = require('./loadManifest.js').load('package.json');

exports.apiV1ModelsGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/

  if(manifest) {
    res.json(manifest.models);
  }
  else {
    res.status(500)
    res.end('Something fails. It has been imposible to load manifest.yaml');
  }
  
  
}

exports.apiV1ModelsModelIdGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * modelId (String)
  **/
  
  if(args.modelId) {
    var model = args.modelId.value;
    if(manifest){
      for(var m in manifest.models){
        if(manifest.models[m].id == model){
          res.json(manifest.models[m]);   
        }
      }
    }
  }
  else {
    res.status(500)
    res.end('Something fails. It has been imposible to load manifest.yaml');
  }
  
  
}

exports.manifestGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
  
  if(manifest) {
    res.json(manifest);
  }
  else {
    res.status(500)
    res.end('Something fails. It has been imposible to load manifest.yaml');
  }
  
  
}

exports.versionGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/

  if(manifest) {
    res.json(moduleInfo.version);
  }
  else {
    res.status(500)
    res.end('Something fails. It has been imposible to load manifest.yaml');
  }
  
  
}

