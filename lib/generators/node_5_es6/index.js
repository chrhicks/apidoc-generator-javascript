import path from 'path';
import fs from 'fs';
import hbs from 'hbs';
import mkdirp from 'mkdirp';
import targz from 'tar.gz';

import { capitalizeFirstLetter, toCamelCase } from '../../utils';
import generators from '../../../generators';

const INVOCATION_KEY = 'node_5_es6';
const UTILS_TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/utils.hbs`);
const CLIENT_TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/client.hbs`);
const RESOURCE_TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/resource.hbs`);

function getClientTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(CLIENT_TEMPLATE_LOCATION).toString('utf-8'));
}

function getResourceTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(RESOURCE_TEMPLATE_LOCATION).toString('utf-8'));
}

function getUtilsTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(UTILS_TEMPLATE_LOCATION).toString('utf-8'));
}

function getGeneratorDescription () {
  if (generators) {
    const generator = generators.find((g) => g.key === INVOCATION_KEY);
    return generator ? generator.description : '';
  }
  return '';
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

function isApplicationJson (operation) {
  return !!operation.body;
}

function isFormUrlEncoded (operation) {
  return !isApplicationJson(operation) && requestCanHaveBody(operation.method);
}

function getBodyType (operation) {
  const maybeType = operation.body.type;
  return maybeType.startsWith('[]') ? maybeType.slice(1).slice(0,-1) : maybeType;
}

function getDiscriminatorForBody (operation, service) {
  if (!operation.body ) {
    return;
  }

  const bodyType = getBodyType(operation);
  const unionType = service.unions.find((u) => u.name === bodyType);

  if (unionType) {
    return unionType.discriminator;
  }
}

function getOperations (operations, resourcePath, service) {
  return operations.map((operation) => {
    return {
      functionName: getFunctionName(operation, resourcePath),
      functionParams: getFunctionParamsStr(operation),
      requiresOptions: requiresOptions(operation),
      requestCanHaveBody: requestCanHaveBody(operation.method),
      isApplicationJson: isApplicationJson(operation),
      isFormUrlEncoded: isFormUrlEncoded(operation),
      requiresBody: !!operation.body || requestCanHaveBody(operation.method),
      endpointUriStr: getEndpointUriStr(operation),
      queryParams: getQueryParameterNames(operation),
      method: operation.method,
      responses: getDeclaredResponses(operation),
      discriminator: getDiscriminatorForBody(operation, service)
    };
  });
}

function createResources (service) {
  const template = getResourceTemplate();

  return service.resources.map((resource) => {
    const resourceFile = {
      name: `${resource.plural}.js`,
      dir: 'app/apidoc',
      contents: template({
        plural: `${capitalizeFirstLetter(toCamelCase(resource.plural))}`,
        operations: getOperations(resource.operations, resource.path, service)
      })
    };

    return resourceFile;
  });
}

function writeTarball (serviceName, serviceVersion, key) {
  const rootPath = `${process.cwd()}/public/packages/dist/${serviceName}/${serviceVersion}/${key}`;
  mkdirp.sync(`${rootPath}`);
  const destFile = `${rootPath}/${serviceName}-${serviceVersion}.tar.gz`;

  return targz()
    .compress(`${process.cwd()}/public/packages/src/${serviceName}-${serviceVersion}/${key}`, destFile);
}

function writeRelease (files, serviceName, serviceVersion, key) {
  files.forEach((file) => {
    const path = `${process.cwd()}/public/packages/src/${serviceName}-${serviceVersion}/${key}`;
    mkdirp.sync(path);
    fs.writeFileSync(`${path}/${file.name}`, file.contents);
  });

  return writeTarball(serviceName, serviceVersion, key);
}

function createPackageFile (service) {
  const json = {
    name: service.name,
    version: service.version.toString(),
    main: 'client.js',
    description: getGeneratorDescription(),
    author: 'apidoc.me'
  };

  return {
    name: 'package.json',
    contents: JSON.stringify(json, null, 2)
  };
}

export function generate (service) {
  const template = getClientTemplate();
  const utilsTemplate = getUtilsTemplate();
  const resourceFiles = createResources(service);
  const clientModel = {
    resources: service.resources.map((r) => {
      return {
        className: capitalizeFirstLetter(r.plural),
        fileName: r.plural
      };
    })
  };

  const clientFile = {
    name: 'client.js',
    contents: template(clientModel)
  };

  const utilsFile = {
    name: 'utils.js',
    contents: utilsTemplate({})
  };

  const files = [clientFile, utilsFile, createPackageFile(service)].concat(resourceFiles);
  const filesWithDir = files.map((f) => {
    return Object.assign(f, { dir: `apidoc/${service.name}`});
  });

  return writeRelease(filesWithDir, service.name, service.version, INVOCATION_KEY)
    .then(() => {
      return filesWithDir;
    });
}
