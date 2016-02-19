import path from 'path';
import fs from 'fs';
import hbs from 'hbs';
import { capitalizeFirstLetter, toCamelCase } from '../../utils';

const INVOCATION_KEY = '5.x.x';
const CLIENT_TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/client.hbs`);
const RESOURCE_TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/client.hbs`);

function getClientTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(CLIENT_TEMPLATE_LOCATION).toString('utf-8'));
}

function getResourceTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(RESOURCE_TEMPLATE_LOCATION).toString('utf-8'));
}

/* private */
function getPathParameters (operation) {
  return operation.parameters.filter((param) => param.location === 'Path');
}

/* private */
function getQueryParameters (operation) {
  return operation.parameters.filter((param) => param.location === 'Query');
}

/* private */
function requiresOptions (operation) {
  var queryPrams = getQueryParameters(operation);
  return queryPrams.length || requestCanHaveBody(operation.method);
}

function requestCanHaveBody (method) {
  var m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH';
}

function getFunctionParamsStr (operation) {
  const params = getPathParameters(operation).map((p) => toCamelCase(p.name));
  const queryParams = getQueryParameters(operation);
  const optionParams = (queryParams.length || requestCanHaveBody(operation.method))
    ? ['options'] : [];

  return params.concat(optionParams).join(', ');
}

/**
 * Turn 'GET /:id/passengers' into 'getPassengersById'
 */
function getFunctionName (operation, resourcePath) {
  if (operation.path) {
    var pathWithOutPrefix = operation.path.replace(resourcePath, '');

    if (pathWithOutPrefix.startsWith('/')) {
      pathWithOutPrefix = pathWithOutPrefix.slice(1);
    }

    const parts = pathWithOutPrefix.split('/');
    const variableParts = parts
      .filter((p) => p.startsWith(':'))
      .map((part, idx) => {
        const prefix = (idx == 0) ? 'By' : 'And';
        return prefix + capitalizeFirstLetter(part.slice(1));
      });

    const staticParts = parts
      .filter((p) => !p.startsWith(':'))
      .map((part, idx) => {
        const prefix = (idx == 0) ? '' : 'And';
        return prefix + capitalizeFirstLetter(part);
      });

    const sortedParts = staticParts.concat(variableParts);

    return operation.method.toLowerCase() + sortedParts.join('');
  } else {
    return operation.method.toLowerCase();
  }
}

function getEndpointUriStr (operation) {
  const START_LITERAL = '${';
  const END_LITERAL = '}';
  const fullPath = operation.path.slice(1);
  const parts = fullPath.split('/')
    .map(function (part) {
      if (part.indexOf(':') === 0) {
        return `/${START_LITERAL}${toCamelCase(part.slice(1))}${END_LITERAL}`;
      }
      return `/${part}`;
    });

  return `${parts.join('')}`;
}

function getQueryParameterNames (operation) {
  return getQueryParameters(operation).map((param) => {
    return {
      name: param.name,
      nameCamelCase: toCamelCase(param.name)
    };
  });
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

function getOperations (operations, resourcePath) {
  return operations.map((operation) => {
    return {
      functionName: getFunctionName(operation, resourcePath),
      functionParams: getFunctionParamsStr(operation),
      requiresOptions: requiresOptions(operation),
      requestCanHaveBody: requestCanHaveBody(operation.method),
      requiresBody: !!operation.body,
      endpointUriStr: getEndpointUriStr(operation),
      queryParams: getQueryParameterNames(operation),
      method: operation.method,
      responses: getDeclaredResponses(operation)
    };
  });
}

function createResources (resources) {
  const template = getResourceTemplate();
  console.dir(resources, { depth: 10, colors: true });


  return resources.map((resource) => {
    const resourceFile = {
      fileName: `${resource.plural}.js`,
      contents: template({
        plural: `${capitalizeFirstLetter(toCamelCase(resource.plural))}`,
        operations: getOperations(resource.operations, resource.path)
      })
    };

    return resourceFile;

    // return {
    //   plural: `${capitalizeFirstLetter(toCamelCase(resource.plural))}`,
    //   operations: getOperations(resource.operations, resource.path)
    // };
  });
}

export function generate (service) {
  const template = getClientTemplate();
  const resources = createResources(service.resources);

  // console.dir(resources, { depth: 10, colors: true });
  const templateModel = {
    resources: service.resources.map((r) => {
      return {
        className: capitalizeFirstLetter(r.plural),
        fileName: r.plural
      }
    })
  };

  console.dir(templateModel, { depth: 10, colors: true });

  const clientFile = {
    fileName: `${service.name}-${service.version}.js`,
    contents: template(templateModel)
  };

  return [clientFile].concat(resources);

  // return template({
  //   resources: resources
  // });
}
