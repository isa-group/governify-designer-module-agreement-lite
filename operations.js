'use strict'

var yaml = require('js-yaml');
var jsonlint = require("jsonlint");
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.translators.sla4oai;
var request = require('request');
var fs = require('fs');
var path = require('path');

var mapMinizincType = {
    boolean: 'bool',
    double: '0.0..1000.0',
    float: '0.0..1000.0',
    integer: '0..1000'
};

module.exports = {
    generateMinizincCCC: function (res, data) {
        var mznData = "";
        res.send(new responseModel('OK', "The Minizinc Compensation Consistency Constraint document has been successfully generated", mznData, null));
    },
    generateMinizincCFC: function (res, data) {
        var agreement = yaml.safeLoad(data[0].content, 'utf8');

        var definitions = agreement.context.definitions.schemas;
        var metrics = agreement.terms.metrics;
        var guarantees = agreement.terms.guarantees;

        var mznData = "";

        mznData += getDefinitionsVar(definitions) + "\n";
        mznData += getMetricsVar(metrics) + "\n";
        mznData += getCFC(guarantees) + "\n";
        //TODO: decide which CSP type of solution to use
        mznData += "solve satisfy;\n";

        res.send(new responseModel('OK', "The Minizinc Compensation Function Constraint document has been successfully generated", mznData, null));
    },
    generateMinizincConstraints: function (res, data) {
        var agreement = yaml.safeLoad(data[0].content, 'utf8');

        var definitions = agreement.context.definitions.schemas;
        var metrics = agreement.terms.metrics;
        var guarantees = agreement.terms.guarantees;

        var mznData = "";
        mznData += getDefinitionsVar(definitions) + "\n";
        mznData += getMetricsVar(metrics) + "\n";
        mznData += getGuarateesConstraints(guarantees) + "\n";
        //TODO: decide which CSP type of solution to use
        mznData += "solve satisfy;\n";

        res.send(new responseModel('OK', "The Minizinc constraints document has been successfully generated", mznData, null));
    },
    generateGovernify: function (res, data) {
        mapper.convertString(data[0].content, (dataResponse) => {

            res.send(new responseModel('OK', "The document has been generated successfully", dataResponse, null));

        }, (err) => {

            if (err.mark)
                res.send(new responseModel('OK_PROBLEMS', 'Has ocurred an error with generation of document: ' + err.toString(), null, [new annotation('error', err.mark.line, err.mark.column, err.reason)]));
            else {
                res.send(new responseModel('OK_PROBLEMS', 'Has ocurred an error with generation of document: ' + err.toString(), null, [new annotation('error', 0, 0, err.toString())]));
            }

        });
    },
    check: function (syntax, res, data) {
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
    translate: function (syntaxSrc, syntaxDes, res, data) {

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
    update: function (res, data, aux2) {

        if (data.length == 2) {

            var agreement = yaml.safeLoad(data[0].content);
            var contractId = agreement.id;

            var reloadConfig = yaml.safeLoad(data[1].content);

            var registryEndpoint = agreement.context.infrastructure.registry;
            var reporterEndpoint = agreement.context.infrastructure.reporter;

            request({
                url: registryEndpoint + '/api/v1/agreements/' + contractId,
                method: 'DELETE'
            }, (err, response, body) => {
                if (err) {
                    console.error(err);
                }

                request({
                    url: registryEndpoint + '/api/v1/agreements/',
                    method: 'POST',
                    json: agreement
                }, (err, response, body) => {
                    if (err) {
                        console.error(err);
                    }

                    if (reloadConfig) {
                        var reloadUrl = registryEndpoint + "/api/v1/states/" + contractId + "/reload";
                        console.log("Entering in reload invocation: " + reloadUrl);
                        if (!reloadUrl) {
                            console.error("Bad reload parameters");
                        } else {
                            request({
                                url: reloadUrl,
                                method: "POST",
                                json: reloadConfig
                            }, function (error, currentResponse, body) {
                                if (error) {
                                    console.error("Reload error: " + error);
                                } else if (currentResponse) {
                                    console.log("Reload response: " + currentResponse.statusCode);
                                    if (currentResponse.statusCode !== 200) {
                                        console.error("Problems with reload (" + currentResponse.statusCode + ")");
                                    } else {

                                        setTimeout(function () {
                                            res.json(new responseModel('OK', "The contract has been updated:" +
                                                "<ul>" +
                                                "<li>Download KPI status: <a href='" + reporterEndpoint + "/api/v2/contracts/" + contractId + "/kpis' target='_blank'>CSV</a> " +
                                                "<a href='" + reporterEndpoint + "/api/v2/contracts/" + contractId + "/kpis?format=json' target='_blank'>JSON</a></li>" +
                                                "<li>Download services status: <a href='" + reporterEndpoint + "/api/v2/contracts/" + contractId + "/services' target='_blank'>CSV</a> " +
                                                "<a href='" + reporterEndpoint + "/api/v2/contracts/" + contractId + "/services?format=json' target='_blank'>JSON</a></li>" +
                                                "</ul>"), null, []);
                                        }, 15000);


                                    }
                                }
                            });
                        }
                    }

                });
            });

        } else {
            console.error('There was an error while retrieving the agreement')
            res.json(new responseModel('ERROR', "There was an error while retrieving the agreement"));
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

// Transform definition schemas to minizinc variables
var getDefinitionsVar = (definitions) => {
    var ret = "";
    if (definitions) {
        var names = Object.keys(definitions);
        names.forEach(function (name) {
            ret += "var " + mapMinizincType[definitions[name].type] + ": " + name + ";\n";
        });
    }
    return "% Definitions variables\n" + ret;
};

// Transform metrics schemas to minizinc variables
var getMetricsVar = (metrics) => {
    var ret = "";
    if (metrics) {
        var names = Object.keys(metrics);
        names.forEach(function (name) {
            ret += "var " + mapMinizincType[metrics[name].schema.type] + ": " + name + ";\n";
        });
    }
    return "% Metrics variables\n" + ret;
};

// Transform guarantees objectives to minizinc contraints
var getGuarateesConstraints = (guarantees) => {
    var ret = "";
    if (guarantees) {
        guarantees.forEach(function (guarantee) {
            guarantee.of.forEach(function (of) {
                if (of.precondition && of.precondition !== "") {
                    // Use "precondition->objective" to define constraint
                    ret += "constraint (" + of.precondition + ") -> (" + of.objective + ");\n";
                } else if (of.objective && of.objective !== "") {
                    // Use "objective" property to define constraint
                    ret += "constraint " + of.objective + ";\n";
                }
            });
        });
    }
    return "% Guarantees objectives\n" + ret;
};

var getCFC = (guarantees) => {
    var mznPenalConstraints = "";
    var mznRewardConstraints = "";
    var ret = "";

    guarantees.forEach(function (guarantee) {
        guarantee.of.forEach(function (of) {

            // CFC for penalties
            of.penalties.forEach(function (penalty) {
                var penaltyName = Object.keys(penalty.over)[0];
                var penaltyCFCs = "";
                penalty.of.forEach(function (_of) {
                    if (_of.value && _of.value !== "" && _of.condition && _of.condition !== "") {
                        if (penaltyCFCs !== "") penaltyCFCs += "\n\txor ";
                        penaltyCFCs += "( ((" + penaltyName + " == " + Math.abs(_of.value) + ") \/\\ (" + _of.condition + "))" +
                            "\n\txor ((" + penaltyName + " == " + 0 + ") \/\\ not (" + _of.condition + ")) )";
                    }
                });
                mznPenalConstraints += penaltyCFCs;
            });

            // CFC for rewards
            of.rewards.forEach(function (reward) {
                var rewardName = Object.keys(reward.over)[0];
                var rewardCFCs = "";
                reward.of.forEach(function (_of) {
                    if (_of.value && _of.value !== "" && _of.condition && _of.condition !== "") {
                        if (rewardCFCs !== "") rewardCFCs += "\n\txor ";
                        rewardCFCs += "( ((" + rewardName + " == " + Math.abs(_of.value) + ") \/\\ (" + _of.condition + "))" +
                            "\n\txor ((" + rewardName + " == " + 0 + ") \/\\ not (" + _of.condition + ")) )";
                    }
                });
                mznRewardConstraints += rewardCFCs;
            });
        });

        if (mznPenalConstraints !== "" || mznRewardConstraints !== "") {
            if (ret !== "") ret += "\n";
            ret += "% CFC for guarantee " + guarantee.id + " \nconstraint " + [mznPenalConstraints, mznRewardConstraints].join("\n\txor ")
                .replace(/(xor)+/g, "xor").replace(/^xor/, "").replace(/xor$/, "") + ";\n";
        }
    });

    return ret;

};