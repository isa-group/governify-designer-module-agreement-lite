/*!
 * Copyright(c) 2016 governify Research Group
 * ISC Licensed
 * 
 * @author Daniel Artega <darteaga@us.es>
 */

'use strict'
var fs = require('fs');
var yaml = require('js-yaml');

module.exports.convertModelOAI2Governify = function(oaiModel, successCb, errorCb){
	convertOAI2Governify(oaiModel, successCb, errorCb);
}


module.exports.convertModelGovernify2OAI = function(governifyModel, successCb, errorCb){
	convertGovernify2OAI(governifyModel, successCb, errorCb);
}

module.exports.convertFileOAI2Governify = function(oaiUri, successCb, errorCb){
	fs.readFile(uri, 'utf8', (err, data) => {
		if(err){
			errorCb(err);
		}else{
			try{
				var oaiModel =  yaml.safeLoad(data, 'utf8');
				convertOAI2Governify(oaiModel, successCb, errorCb);	
			}catch(e){
				errorCb(e);
			}
		}
	});
}

module.exports.convertFileGovernify2OAI = function(governifyUri, successCb, errorCb){
	fs.readFile(uri, 'utf8', (err, data) => {
		if(err){
			errorCb(err);
		}else{
			try{
				var governifyModel =  yaml.safeLoad(data, 'utf8');
				convertGovernify2OAI(governifyModel, successCb, errorCb);
			}catch(e){
				errorCb(e);
			}
		}
	});
}

module.exports.convertStringOAI2Governify = function(oaiString, successCb, errorCb){
	try{
		var oaiModel =  yaml.safeLoad(oaiString, 'utf8');
		convertOAI2Governify(oaiModel, successCb, errorCb);
	}catch(e){
		errorCb(e);
	}
}


module.exports.convertStringGovernify2OAI = function(governifyString, successCb, errorCb){
	try{
		var governifyModel =  yaml.safeLoad(governifyString, 'utf8');
		convertGovernify2OAI(governifyModel, successCb, errorCb);
	}catch(e){
		errorCb(e);
	}
}

function convertOAI2Governify (oaiModel, successCb, errorCb){
	console.log('::::::::::::::::::: OAI MODEL :::::::::::::::::::');
	console.log(oaiModel);
	var governifyModel = new governify(
			oaiModel.context.id,
			oaiModel.context.sla,
			oaiModel.context.type == 'plans' ? 'template' : 'agreement',
			new context(
				oaiModel.context.provider,
				oaiModel.context.consumer,
				oaiModel.context.validity ? new validity(oaiModel.context.validity.effectiveDate, oaiModel.context.validity.expirationDate) : null,
				oaiModel.infrastructure,
				new definitions(
					oaiModel.metrics
				)
			),
			new agreementTerms(
				new pricing(
					oaiModel.pricing.cost ? oaiModel.pricing.cost : 0 ,
					oaiModel.pricing.currency ? oaiModel.pricing.currency : 'EUR', 
					oaiModel.pricing.billing ? oaiModel.pricing.billing : 'monthly'
				) ,
				{}, //configurations
				{}, //metrics
				{}, //quotas
				{}, //rates
				{} //guarantees
			),
			{} //creationConstraints
		);

	//processing default configurations
	
	if(oaiModel.availability){
		var values = []; 
		var availability = {};
		availability[oaiModel.pricing.plan ? oaiModel.pricing.plan : '*'] = {of: oaiModel.availability}
		values.push(availability);
		governifyModel.agreementTerms.configurations['availability'] = new configuration(values);
	}
	for(var conf in oaiModel.configuration){
		var vals = [];
		var config = {};
		config[oaiModel.pricing.plan ? oaiModel.pricing.plan : '*'] = {of: oaiModel.configuration[conf] };
		vals.push(config);
		governifyModel.agreementTerms.configurations[conf] = new configuration(vals);
	}

	//Processing default quotas

	if(oaiModel.quotas){
		for (var path in oaiModel.quotas){
			for(var operation in oaiModel.quotas[path]){
				for(var m in oaiModel.quotas[path][operation]){

					if(!governifyModel.agreementTerms.metrics[m])
						governifyModel.agreementTerms.metrics[m] = new metric(m);

					if(!governifyModel.agreementTerms.quotas['quota_' + m])
						governifyModel.agreementTerms.quotas['quota_' + m] = new quota(m);

					for(var li in oaiModel.quotas[path][operation][m]){
						var exist = false;
						for(var of in governifyModel.agreementTerms.quotas['quota_' + m].of ){
							if(governifyModel.agreementTerms.quotas['quota_' + m].of[of]['*,'+path+','+operation+','+ oaiModel.quotas[path][operation][m][li].scope])
								exist = true;
						}
						if(exist){
							governifyModel.agreementTerms.quotas['quota_' + m].of.push();	
						}
							
					}		
				}
			}
		}
	}

	successCb( yaml.safeDump(governifyModel) );
}

function convertGovernify2OAI(governifyModel, successCb, errorCb){
	successCb("convertGovernify2OAI");
}

/** GOVERNIFY MODEL **/

function governify(id, version, type, context, agreementTerms, creationConstraints){
	this.id = id;
	this.version = version;
	this.type = type;
	this.context = context;
	this.agreementTerms = agreementTerms;
	this.creationConstraints = creationConstraints;
}

function context(provider, consumer, validity, infrastructure, definitions){
	this.provider = provider;
	if(consumer)
		this.consumer = consumer;
	if(validity)
		this.validity = validity;
	this.infrastructure = infrastructure;
	this.definitions = definitions;
}

function validity(init, end){
	this.init = init;
	this.end = end;
}

function definitions(schemas){
	this.schemas = schemas;
	this.scopes = oaiScopes();
}

function oaiScopes(){
	return {
		api: {
			resource: {
				description: 'Defines the path in which limits will be checked',
				type: 'string'
			},
			operation: {
				description: 'Defines the operations in which limits will be checked',
				type: 'string'
			}
		},
		oai: {
			level: {
				description: 'Defines the level inside the organization in which limits will be checked',
          		type: 'string'
			}
		},
		offering: {
			plan: {
				description: 'Defines diferent levels of service that are provided',
				type: 'string'
			}
		}
	}
}
function agreementTerms(pricing, configurations, metrics, quotas, rates, guarantees){
	this.pricing = pricing;
	this.configurations = configurations;
	this.metrics = metrics;
	this.quotas = quotas;
	this.rates = rates;
	this.guarantees = guarantees;
}

function configuration (values){
	this.scope = [{ '$ref' : "#/context/definitions/scopes/offering/plan" }];
	this.values = values;
}

function pricing(cost, currency, billing){
	this.cost = cost;
	this.currency = currency;
	this.billing = new billingObject(billing);
}

function billingObject(period, init){
	this.period = period;
	if(init)
		this.init = init;
}

function quota(metric){
	this.scope = [
		{$ref: "#/context/definitions/scopes/offering/plan" },
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	];

	this.over = {$ref: "#/agreementTerms/metrics/" + metric};

	this.of = [];

}

function metric(metric){
	this.schema = {$ref: "#/context/definitions/schemas/" + metric}

	this.scope = [
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	]
}

function creationConstraints(){

}

function constraint(over, of){

}