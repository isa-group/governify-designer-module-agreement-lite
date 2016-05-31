'use strict'

var yaml = require('js-yaml');
var jsonlint = require("jsonlint");
var isaToOai = require('./isaToOAI');

module.exports = {
	generateGovernify: function(res, data){
		isaToOai.convertStringOAI2Governify(data[0].content, (dataResponse) => {

			res.send(new responseModel('OK', "The document has been generated successfully", dataResponse, null));

		}, (err) => {

			res.send(new responseModel('OK_PROBLEMS', err.toString(), 'Has ocurred an error with generation of document: ' + err.reason, [new annotation('error', err.mark.line, err.mark.column, err.reason)]));

		});
	},
	check: function(syntax, res, data){
		switch(syntax){
			case 'json':
				try {
				    jsonlint.parse(data.content);
				    res.json(new responseModel('OK', null, null, null));
				} catch (e) {
				    var row = e.toString().split("line ")[1].split(":")[0];
				    var annotations = [new annotation('error', parseInt(row)-1 + '', '1', e.toString())]
				    res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
				}
				break;
			case 'yaml':
				try {
				  yaml.safeLoad(data.content, 'utf8');
				  res.json(new responseModel('OK', null, null, null));
				} catch (e) {
				  var annotations = [new annotation('error', e.mark.line, e.mark.column, e.reason)];
				  res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
				}
				break;
		}
	},
	translate: function(syntaxSrc, syntaxDes, res, data){

		switch(syntaxSrc){
			case 'json':
				if(syntaxDes != 'yaml'){

					translateCombinationError(res, syntaxDes);

				}else{

					var dataObject = JSON.parse(data.content);
					res.json(new responseModel('OK', 'The content has been translated', yaml.safeDump(dataObject), []));

				}
				break;
			case 'yaml':
				if(syntaxDes != 'json'){

					translateCombinationError(res, syntaxDes);

				}else{

					var dataObject = yaml.safeLoad(data.content);
					res.json(new responseModel('OK', 'The content has been translated', JSON.stringify(dataObject, null, 2), []));

				}
				break;
			default:
				res.json( new responseModel('ERROR', "It is not possible to translate from " + syntaxSrc + " to " + syntaxDes, null, []));
		}

	}
}

function translateCombinationError(res, syntaxDes){
	res.json(new responseModel("ERROR", "It is not possible to translate from yaml to " + syntaxDes, null, []));
}

function responseModel (status, message, data, annotations){
  this.status = status;
  this.message = message;
  this.data = data;
  this.annotations = annotations;
}

function annotation(type, row, column, text){
	this.type = type;
	this.row = row;
	this.column = column;
	this.text = text;
}
