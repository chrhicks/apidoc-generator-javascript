'use strict';

var util = require('util');
var utils = require('./utils');
var _ = require('lodash');

function createResource (properties) {
  var operations = properties.operations;
  var resource = {
    name: properties.type,
    objectName: utils.capitalizeFirstLetter(utils.toCamelCase(properties.type)),
    methods: operations.map(function (op) {
      return createOperation(properties.plural, op);
    })
  };

  // console.log(util.inspect(resource, false, 5, true));

  return resource;
}

function createOperation (pathRoot, operation) {
  // console.log(pathRoot, operation);

  return {
    method: operation.method,
    path: operation.path,
    uriJs: getPathStringBuilder(pathRoot, operation),
    functionName: getFunctionName(operation),
    functionParameters: getPathParameters(operation),
    functionParametersJs: getFunctionParametersJs(operation),
    queryStringParameters: getQueryParameters(operation)
  };
}

function getPathStringBuilder (pathRoot, operation) {
  var SINGLE_QUOTE = '\'';
  var PLUS = '+';
  var PATH_DELIMETER = '/';
  var SPACE = ' ';

  var finalPathStr = SINGLE_QUOTE;
  var fullPath = getFullPath(pathRoot, operation).slice(1);
  var parts = fullPath.split('/')
    .map(function (part) {
      if (part.indexOf(':') === 0) {
        return PATH_DELIMETER + SINGLE_QUOTE + SPACE + PLUS + SPACE + part.slice(1) + SPACE + PLUS + SPACE + SINGLE_QUOTE;
      }

      return PATH_DELIMETER + part;
    });

  finalPathStr += parts.join('') + SINGLE_QUOTE;

  return finalPathStr;

}

function getQueryParameters (operation) {
  var pathParams = getPathParameters(operation);
  var params = operation.parameters || [];

  params = params.map(function (p) { return p.name; });

  return _.filter(params, function (p) { return  pathParams.indexOf(p) === -1; });
}

function getFunctionParametersJs(operation) {
  return getPathParameters(operation).map(function (p) {
    return utils.toCamelCase(p);
  }).join(', ');
}

function getPathParameters (operation) {
  if (operation.path) {
    var filtered = operation.path
      .split('/')
      .filter(function (z) { return z.indexOf(':') === 0; })
      .map( function (z) { return z.slice(1); });

      return filtered;
  } else {
    return [];
  }
}

function getFullPath (pathRoot, operation) {
  var path = '/' + pathRoot;

  if (operation.path) {
    path += operation.path;
  }

  return path;
}

function getFunctionName (operation) {
  var name = operation.method.toLowerCase();

  name += pathToCapitalCase(operation);

  return name;
}

function pathToCapitalCase (operation) {
  var parts;
  var pathParamTokens;
  var otherPathTokens;
  var finalTokens = [];

  if (operation.path) {
    parts = operation.path.split('/');
    pathParamTokens = parts.filter(function (part) { return part.indexOf(':') === 0;});
    otherPathTokens = parts.filter(function (part) { return part.indexOf(':') === -1;});

    otherPathTokens = otherPathTokens.map(function (token) { return utils.capitalizeFirstLetter(utils.toCamelCase(token)); });
    pathParamTokens = pathParamTokens.map(function (token, index) {
      var prefix = (index === 0) ? 'By': 'And';
      return prefix + utils.capitalizeFirstLetter(utils.toCamelCase(token.slice(1)));
    });

    finalTokens = finalTokens.concat(otherPathTokens);
    finalTokens = finalTokens.concat(pathParamTokens);

    return finalTokens.join('');
  }

  return '';
}


module.exports = {
  createResource: createResource
};
