'use strict'

var yaml = require('js-yaml');
var jsonlint = require("jsonlint");
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.translators.sla4oai;
var request = require('request');
var fs = require('fs');
var path = require('path');
// Agreement Analyzer
// const AgreementAnalyzer = require("governify-agreement-analyzer");
const AgreementAnalyzer = require("governify-agreement-analyzer");
const AgreementModel = AgreementAnalyzer.AgreementModel;
// CSP Tools
const annotationErrorFilter = /(.*mzn:.*|MiniZinc:\s+)/g;
// CSP reasoner remote configuration
const apiVersion = process.env.CSP_REASONER_API_VERSION;
const apiServer = process.env.CSP_REASONER_API_SERVER;
const apiOperation = process.env.CSP_REASONER_API_OPERATION;
// Agreement-lite
const SAMPLE_AGREEMENT_TITLE = "Sample_agreement_title";

module.exports = {
    checkCFC: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableCFC(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Compensation Function Constraint\" (CFC)", isSatisfiable, document), data, null));
        });

    },
    checkVFC: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableVFC(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Valid Function Constraint\" (VFC)", isSatisfiable, document), data, null));
        });

    },
    checkCCC: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableCCC(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Compensation Consistency Constraint\" (CCC)", isSatisfiable, document), data, null));
        });

    },
    checkCSC: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableCSC(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Compensation Saturation Constraint\" (CSC)", isSatisfiable, document), data, null));
        });

    },
    checkGCC: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableGCC(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Guarantee Consistency Constraint\" (GCC)", isSatisfiable, document), data, null));
        });

    },
    checkOGT: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableOGT(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Optimal Guarantor Threshold\" (OGT)", isSatisfiable, document), data, null));
        });
    },
    checkOBT: function (res, data) {

        let analyzer = _initAnalyzer(yaml.safeLoad(data[0].content, 'utf8'));
        analyzer.isSatisfiableOBT(function (err, stdout, stderr, isSatisfiable, document) {
            res.send(new responseModel('OK', cspResponse(err, stdout, "\"Optimal Beneficiary Threshold\" (OBT)", isSatisfiable, document), data, null));
        });

    },
    checkConsistency: function (syntax, res, data) {

        try {

            if (data.content === "") {

                // Nothing to do
                res.json(new responseModel('OK', null, null, null));

            } else {

                switch (syntax) {

                    case 'yaml':
                        _checkConsistency(yaml.safeLoad(data.content, 'utf8'), res);
                        break;

                    case 'json':
                        _checkConsistency(JSON.parse(data.content), res);
                        break;

                }

            }

        } catch (err) {
            console.error(err);
            let msg = (typeof err === "object") && err.message ? err.message : err;
            let annotations = [new annotation('error', 0, 0, msg)];
            res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
        }

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
    check: function (modelId, syntax, res, data) {

        if (modelId === "agreement") {

            this.checkAgreement(modelId, syntax, res, data);

        } else {

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
        }

    },
    checkAgreement: function (modelId, syntax, res, data) {

        if (data.content === "") {

            // Nothing to do
            res.json(new responseModel('OK', null, null, null));

        } else {

            switch (syntax) {

                case 'json':

                    try {

                        let agreement = jsonlint.parse(data.content);
                        var model = new AgreementModel(agreement);
                        let isValid = model.validate();

                        if (isValid) {
                            res.json(new responseModel('OK', null, null, null));
                        } else {
                            let annotations = [new annotation('error', 0, 0, agreementValidationErrorToString(model.validationErrors[0]))];
                            res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                        }

                    } catch (e) {
                        var row = e.toString().split("line ")[1].split(":")[0];
                        var annotations = [new annotation('error', parseInt(row) - 1 + '', '1', e.toString())]
                        res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                    }

                    break;

                case 'yaml':

                    try {

                        let agreement = yaml.safeLoad(data.content, 'utf8');
                        var model = new AgreementModel(agreement);
                        let isValid = model.validate();

                        if (isValid) {
                            res.json(new responseModel('OK', null, null, null));
                        } else {
                            let annotations = [new annotation('error', 0, 0, agreementValidationErrorToString(model.validationErrors[0]))];
                            res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                        }

                    } catch (e) {
                        var annotations = [new annotation('error', e.mark.line, e.mark.column, e.reason)];
                        res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                    }

                    break;

            }
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

function cspResponse(err, stdout, opTitle, isSatisfiable, document) {

    let index = Math.round(Math.random() * 1000);
    let linkTitle = "details of execution";

    if (!err) {
        return '<pre><div>The result of operation ' + opTitle + ' in the current document is: <strong>' + String(isSatisfiable).toUpperCase() +
            '</strong></div><div>' + generateCollapsiblePanel(index, linkTitle, stdout + "\n" + document) + '</div></pre>';
    } else {
        let errMsg = err && typeof err === "object" && typeof err.message ? err.message : err;
        let detailMsg = document ? document : errMsg;
        return '<pre><div style="color:red;">There was an error executing ' + opTitle + ' operation</strong></div><div>' +
            generateCollapsiblePanel(index, linkTitle, detailMsg) + '</div></pre>';
    }


}

function generateCollapsiblePanel(index, linkTitle, message) {
    return "<span onclick=\"$('.link-" + index + "').text(($('.span-" + index + "').css('display') == 'block' ? 'Show' : 'Hide') + ' " +
        linkTitle +
        "');" +
        "$('.span-" +
        index +
        "').toggle('slow')\">" +
        "\n\n" +
        "<a class='link-" +
        index +
        "' href=\"javascript:void(0)\" style=\"font-style: normal; font-size: 11px;\">Show " +
        linkTitle +
        "</a>" +
        "</span>" +
        "<div class=\"span-" +
        index +
        "\" style=\"display:none; font-style: normal; font-family: Courier; font-size:11px;\">" +
        message + "</div>";
}

function agreementValidationErrorToString(error) {
    let keyword = error.keyword;
    let dataPath = error.dataPath;
    let schemaPath = error.schemaPath;
    let missingProperty = error.params.missingProperty;
    let message = error.message;

    return "keyword=" + keyword + ", dataPath=" + dataPath + ", schemaPath=" +
        schemaPath + ", missingProperty=" + missingProperty + ", message=" + message;
}

function isSatisfiable(err, sol) {
    if (err) {
        logger.info("Reasoner returned an error:", err);
    }
    return (typeof sol === "string" && sol.indexOf("----------") !== -1) ||
        (typeof sol === "object" && sol.status === "OK" && sol.message.indexOf("----------") !== -1);
}

let _initAnalyzer = (model) => {

    return new AgreementAnalyzer({
        agreement: {
            content: model
        },
        reasoner: {
            type: "api",
            folder: "csp_files",
            api: {
                version: apiVersion,
                server: apiServer,
                operationPath: apiOperation
            }
        }
    });

};

let _checkConsistency = (model, res) => {

    if (model.id === SAMPLE_AGREEMENT_TITLE) {
        res.json(new responseModel('OK', null, null, null));
        return;
    }

    let analyzer = _initAnalyzer(model);
    analyzer.isSatisfiableConstraints(function (err, stdout, stderr, isSatisfiable, document) {

        if (typeof stdout === "object") {
            stderr = stdout.reasoner.stderr;
            err = stdout.reasoner.err;
            isSatisfiable = stdout.reasoner.isSatisfiable;
            stdout = stdout.reasoner.stdout;
            document = stdout.reasoner.cspFileContent;
        }

        if (err && typeof err === "object") {

            var re = /.*\.mzn:([0-9]+):.*/;
            var annotations = [];
            var errorMsgs = stderr.split(/\r?\n\r?\n/);

            if (errorMsgs) {
                errorMsgs.forEach((errorMsg, index) => {
                    let e = errorMsg.replace(annotationErrorFilter, "").trim();
                    if (index === 0) e = "CSP execution error:\n" + e;
                    annotations.push(new annotation('error', 0, 0, e));
                });

                if (annotations.length > 0) {
                    res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                } else {
                    res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, stderr ?
                        "CSP " + stderr.replace(annotationErrorFilter, "").trim() :
                        (typeof error === "object" && error.message) ? "CSP " + error.message.replace(annotationErrorFilter, "").trim() : "")]));
                }

            } else {
                annotations.push(new annotation('error', 0, 0, err));
                res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
            }

        } else if (err && typeof err === "string") {
            // Consider a mask error message from server, i.e. error 500.
            res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, err)]));
        } else if (stdout.indexOf("=====UNSATISFIABLE=====") === -1) {
            res.json(new responseModel('OK', null, null, null));
        } else {
            res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, stdout)]));
        }

        return;

    });

};