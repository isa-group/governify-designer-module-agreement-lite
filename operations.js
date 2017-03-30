'use strict'

var yaml = require('js-yaml');
var jsonlint = require("jsonlint");
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.translators.sla4oai;
var request = require('request');
var fs = require('fs');
var path = require('path');
// Agreement Analyzer
const AgreementAnalyzer = require("governify-agreement-analyzer");
const AgreementModel = AgreementAnalyzer.AgreementModel;
const AgreementCompensationCSPModelBuilder = AgreementAnalyzer.AgreementCompensationCSPModelBuilder;
// CSP Tools
const CSPTools = require("governify-csp-tools");
const Reasoner = CSPTools.Reasoner;
const CSPModelMinizincTranslator = CSPTools.CSPModelMinizincTranslator;
const annotationErrorFilter = /(.*mzn:.*|MiniZinc:\s+)/g;
// CSP reasoner remote configuration
const apiVersion = "v1";
const apiServer = process.env.CSP_TOOLS_SERVER + "/reasoner";
const apiOperation = "execute";

module.exports = {
    checkCFC: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableCFC(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "CFC"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkCCC: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableCCC(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "CCC"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkCSC: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableCSC(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "CSC"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkGCC: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableGCC(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "GCC"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkOGT: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableOGT(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "OGT"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkOBT: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableOBT(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "OBT"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkConstraints: function (res, data) {

        let analyzer = new AgreementAnalyzer({
            agreement: {
                content: yaml.safeLoad(data[0].content, 'utf8')
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

        analyzer.isSatisfiableConstraints(function (err, stdout, stderr, isSatisfiable) {
            if (!err) {
                res.send(new responseModel('OK', cspResponse(err, stdout, "constraints"), data, null));
            } else {
                res.send(err);
            }
        });

    },
    checkConsistency: function (syntax, res, data) {

        if (data.content === "") {

            // Nothing to do
            res.json(new responseModel('OK', null, null, null));

        } else {

            switch (syntax) {

                case 'yaml':

                    var analyzer = new AgreementAnalyzer({
                        agreement: {
                            content: yaml.safeLoad(data.content, 'utf8')
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

                    analyzer.isSatisfiableConstraints(function (err, stdout, stderr, isSatisfiable) {
                        if (typeof stdout === "object") {
                            stderr = stdout.reasoner.stderr;
                            err = stdout.reasoner.err;
                            isSatisfiable = stdout.reasoner.isSatisfiable;
                            stdout = stdout.reasoner.stdout;
                        }
                        if (err) {

                            var re = /.*\.mzn:([0-9]+):.*/;
                            var annotations = [];
                            var errorMsgs = stderr.split(/\r?\n\r?\n/);

                            errorMsgs.forEach((errorMsg, index) => {
                                let e = errorMsg.replace(annotationErrorFilter, "").trim();
                                if (index === 0) e = "CSP execution error:\n" + e;
                                annotations.push(new annotation('error', 0, 0, e));
                            });

                            if (annotations.length > 0) {
                                res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                            } else {
                                res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, stderr ?
                                    "CSP execution error: " + stderr.replace(annotationErrorFilter, "").trim() :
                                    (typeof error === "object" && error.message) ? "CSP execution error: " + error.message.replace(annotationErrorFilter, "").trim() : "")]));
                            }

                        } else if (stdout.indexOf("=====UNSATISFIABLE=====" === -1)) {
                            res.json(new responseModel('OK', null, null, null));
                        } else {
                            res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, stdout)]));
                        }
                    });

                    break;

                case 'json':

                    var analyzer = new AgreementAnalyzer({
                        agreement: {
                            content: JSON.parse(data.content)
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

                    analyzer.isSatisfiableConstraints(function (err, stdout, stderr, isSatisfiable) {
                        if (err) {

                            var re = /.*\.mzn:([0-9]+):.*/;
                            var annotations = [];
                            var errorMsgs = stderr.split(/\r?\n\r?\n/);

                            errorMsgs.forEach((errorMsg, index) => {
                                annotations.push(new annotation('error', 0, 0, errorMsg.replace(annotationErrorFilter, "").trim()));
                            });

                            if (annotations.length > 0) {
                                res.json(new responseModel('OK_PROBLEMS', null, null, annotations));
                            } else {
                                res.json(new responseModel('OK_PROBLEMS', null, null, [new annotation('error', 0, 0, stderr ?
                                    stderr.replace(annotationErrorFilter, "").trim() :
                                    (typeof error === "object" && error.message) ? error.message.replace(annotationErrorFilter, "").trim() : "")]));
                            }

                        } else {
                            res.json(new responseModel('OK', null, null, null));
                        }
                    });

                    break;
            }

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
    check: function (syntax, res, data) {
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

function cspResponse(err, stdout, type) {

    let index = Math.round(Math.random() * 1000);
    let linkTitle = "details";

    return "<pre><div>The document has been successfully executed</div><div>" + generateCollapsiblePanel(index, linkTitle, stdout) + "</div></pre>";

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