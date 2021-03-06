'use strict';

var path = require('path');
var appRoot = path.join(__dirname, '../../..');
// var util = require('util');
var utils = require(path.join(appRoot, './lib/utils'));
// var _ = require('lodash');

function createResource (properties, imports) {
  var operations = properties.operations;
  var resource = {
    name: properties.type,
    objectName: getResourceObjectName(properties.plural),
    methods: operations.map(function (op) {
      return createOperation(properties.plural, op);
    })
  };

  // console.log(util.inspect(resource, false, 5, true));

  return resource;
}

function getExternalModelMap (imports) {
  var externalModels = {};

  imports.forEach(function (imp) {
    imp.models.forEach(function (model) {
      externalModels[`${imp.namespace}.models.${model}`] = utils.toCamelCase(model);
    });
  });

  return externalModels;
}

function getResourceObjectName (plural) {
  return utils.capitalizeFirstLetter(
    utils.toCamelCase(plural)
  );
}

function createOperation (pathRoot, operation) {
  // console.log(pathRoot, operation);

  return {
    description: operation.description,
    method: operation.method,
    path: operation.path,
    uriJs: getPathStringBuilder(pathRoot, operation),
    functionName: getFunctionName(operation),
    functionParameters: getParameterData(operation),
    functionParametersJs: getFunctionParametersJs(operation),
    queryStringParameters: getQueryParameterNames(operation),
    responses: getDeclaredResponses(operation),
    requestCanHaveBody: requestCanHaveBody(operation.method),
    requiresOptions: requiresOptions(operation),
    requiresBody: !!operation.body
  };
}

function getParameterData (operation) {
  var pathParams = getPathParameters(operation);
  var queryPrams = getQueryParameters(operation);
  var paramData = pathParams.map(function (param) {
    return {
      name: utils.toCamelCase(param.name),
      type: '{string}'
    };
  });
  var objectProperties = [];

  if (requestCanHaveBody(operation.method)) {
    objectProperties.push({
      name: 'data',
      type: '{Object}',
      description: 'The request body'
    });

    // TODO: Look up potential model for the body and report it as well
    // if (operation.body && operation.body.type) {
    //   var bodyType = operation.body.type;
    // }
  }

  queryPrams.forEach(function (param) {
    objectProperties.push({
      name: utils.toCamelCase(param.name),
      type: '{' + getJSDocType(param.type) + '}'
    });
  });

  if (objectProperties.length) {
    paramData.push({
      name: 'options',
      type: '{Object}',
      properties: objectProperties
    });
  }

  return paramData;
}

function getJSDocType (apiDocType) {
  var isArray = false;
  var paramType = apiDocType;

  if (apiDocType.indexOf('[') === 0) {
    isArray = true;
    paramType = apiDocType.slice(1, -1);
  }

  function typeOrArrayType (type) {
    return isArray ? type + '[]' : type;
  }

  switch (paramType) {
    case 'boolean':
      return typeOrArrayType('boolean');
    case 'decimal':
    case 'double':
    case 'integer':
    case 'long':
      return typeOrArrayType('number');
    case 'date-iso8601':
    case 'date-time-iso8601':
    case 'string':
    case 'uuid':
      return typeOrArrayType('string');
    case 'object':
      return typeOrArrayType('Object');
    case 'unit':
      return 'undefined';
    default:
      return '*';
  }
}

function getDeclaredResponses (operation) {
  return operation.responses.filter(function (response) {
    return response.code && response.code.integer;
  }).map(function (response) {
    var status = response.code.integer.value;
    return {
      code: status,
      type: response.type,
      isUnitType: response.type === 'unit',
      isResolve: status >= 200 && status < 300
    };
  });
}

function getPathStringBuilder (pathRoot, operation) {
  var SINGLE_QUOTE = '\'';
  var PLUS = '+';
  var PATH_DELIMETER = '/';
  var SPACE = ' ';

  var finalPathStr = SINGLE_QUOTE;
  var fullPath = operation.path.slice(1);
  var parts = fullPath.split('/')
    .map(function (part) {
      if (part.indexOf(':') === 0) {
        return PATH_DELIMETER + SINGLE_QUOTE + SPACE + PLUS + SPACE + utils.toCamelCase(part.slice(1)) + SPACE + PLUS + SPACE + SINGLE_QUOTE;
      }

      return PATH_DELIMETER + part;
    });

  finalPathStr += parts.join('') + SINGLE_QUOTE;

  return finalPathStr;

}

function requiresOptions (operation) {
  var queryPrams = getQueryParameters(operation);
  return queryPrams.length || requestCanHaveBody(operation.method);
}

function requestCanHaveBody (method) {
  var m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH';
}

function getFunctionParametersJs(operation) {
  var params = getPathParameters(operation).map(function (p) {
    return utils.toCamelCase(p.name);
  });
  var queryPrams = getQueryParameters(operation);

  if (queryPrams.length || requestCanHaveBody(operation.method)) {
    params.push('options');
  }

  return params.join(', ');
}

function getQueryParameters (operation) {
  return operation.parameters.filter(function (param) {
    return param.location === 'Query';
  });
}

function getQueryParameterNames (operation) {
  return getQueryParameters(operation).map(function (param) {
    return {
      name: param.name,
      nameCamelCase: utils.toCamelCase(param.name)
    };
  });
}

function getPathParameters (operation) {
  return operation.parameters.filter(function (param) {
    return param.location === 'Path';
  });
}

function getFunctionName (operation) {
  var name = operation.method.toLowerCase();

  name += pathToCapitalCase(operation);

  return utils.alphaNumOnly(name);
}

function pathToCapitalCase (operation) {
  var parts;
  var pathParamTokens;
  var otherPathTokens;
  var finalTokens = [];

  if (operation.path) {
    parts = operation.path.slice(1).split('/');
    parts = parts.slice(1); // drop the resource name prefix

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
  createResource: createResource,
  getQueryParameters: getQueryParameters,
  getQueryParameterNames: getQueryParameterNames,
  getDeclaredResponses: getDeclaredResponses,
  getResourceObjectName: getResourceObjectName
};
