'use strict'

var yaml = require('js-yaml');
var jsonlint = require("jsonlint");
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.translators.sla4oai;
var request = require('request');
var fs = require('fs');
var path = require('path');

module.exports = {
	generateGovernify: function(res, data) {
		mapper.convertString(data[0].content, (dataResponse) => {

			res.send(new responseModel('OK', "The document has been generated successfully", dataResponse, null));

		}, (err) => {

			res.send(new responseModel('OK_PROBLEMS', 'Has ocurred an error with generation of document: ' + err.toString(), null, [new annotation('error', err.mark.line, err.mark.column, err.reason)]));

		});
	},
	check: function(syntax, res, data) {
		switch (syntax) {
			case 'json':
				try {
					jsonlint.parse(data.content);
					res.json(new responseModel('OK', null, null, null));
				} catch (e) {
					var row = e.toString().split("line ")[1].split(":")[0];
					var annotations = [new annotation('error', parseInt(row) - 1 + '', '1', e.toString())]
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
	translate: function(syntaxSrc, syntaxDes, res, data) {

		switch (syntaxSrc) {
			case 'json':
				if (syntaxDes != 'yaml') {

					translateCombinationError(res, syntaxDes);

				} else {

					var dataObject = JSON.parse(data.content);
					res.json(new responseModel('OK', 'The content has been translated', yaml.safeDump(dataObject), []));

				}
				break;
			case 'yaml':
				if (syntaxDes != 'json') {

					translateCombinationError(res, syntaxDes);

				} else {

					var dataObject = yaml.safeLoad(data.content);
					res.json(new responseModel('OK', 'The content has been translated', JSON.stringify(dataObject, null, 2), []));

				}
				break;
			default:
				res.json(new responseModel('ERROR', "It is not possible to translate from " + syntaxSrc + " to " + syntaxDes, null, []));
		}

	},
	update: function(res, data) {
		if (data.length > 0) {

			var content = yaml.safeLoad(data[0].content);
			var contractId = content.id;
			var fileName = data[0].fileUri.replace(/\\.[^/.]+$/, '').split('/').pop();

			request({
				url: 'http://registry.sas.governify.io/api/v1/agreements/' + contractId,
				method: 'DELETE'
			}, (err, response, body) => {
				if (err) {
					console.error(err);
				}

				request({
					url: 'http://registry.sas.governify.io/api/v1/agreements/',
					method: 'POST',
					json: content
				}, (err, response, body) => {
					if (err) {
						console.error(err);
					}

					var filePath = path.join(__dirname, 'config/reloadConfig.json');

					fs.readFile(filePath, {
						encoding: 'utf-8'
					}, (err, reloadConfig) => {
						if (err) throw err;

						if (reloadConfig) {
							reloadConfig = yaml.safeLoad(reloadConfig);
							var reloadUrl = "http://registry.sas.governify.io/api/v1/states/" + contractId + "/reload";
							console.log("Entering in reload invocation: " + reloadUrl);
							if (!reloadUrl) {
								console.error("Bad reload parameters");
							} else {
								request({
									url: reloadUrl,
									method: "POST",
									json: reloadConfig
								}, function(error, currentResponse, body) {
									if (error) {
										console.error("Reload error: " + error);
									} else if (currentResponse) {
										console.log("Reload response: " + currentResponse.statusCode);
										if (currentResponse.statusCode !== 200) {
											console.error("Problems with reload (" + currentResponse.statusCode + ")");
										} else {

											setTimeout(function() {
												res.json(new responseModel('OK', "The contract has been updated:" +
													"<ul>" +
													"<li>Download KPI status: <a href='http://reporter.services.sas.governify.io/api/v1/contracts/" + contractId + "/kpis' target='_blank'>CSV</a> " +
													"<a href='http://reporter.services.sas.governify.io/api/v1/contracts/" + contractId + "/kpis?format=json' target='_blank'>JSON</a></li>" +
													"<li>Download services status: <a href='http://reporter.services.sas.governify.io/api/v1/contracts/" + contractId + "/services' target='_blank'>CSV</a> " +
													"<a href='http://reporter.services.sas.governify.io/api/v1/contracts/" + contractId + "/services?format=json' target='_blank'>JSON</a></li>" +
													"</ul>"), null, []);
											}, 15000);


										}
									}
								});
							}
						}

					});

				});
			});

		} else {
			console.error('There was an error while retrieving the agreement')
		}
	}
}

function translateCombinationError(res, syntaxDes) {
	res.json(new responseModel("ERROR", "It is not possible to translate from yaml to " + syntaxDes, null, []));
}

function responseModel(status, message, data, annotations) {
	this.status = status;
	this.message = message;
	this.data = data;
	this.annotations = annotations;
}

function annotation(type, row, column, text) {
	this.type = type;
	this.row = row;
	this.column = column;
	this.text = text;
}