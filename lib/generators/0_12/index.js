'use strict';

var path = require('path');
var appRoot = path.join(__dirname, '../../..');
var fs = require('fs');
var hbs = require('hbs');

var utils = require(path.join(appRoot, './lib/utils'));
var resource = require('./resource');

const invocationKey = 'node_0_12';

function generate (service) {
  var resources = service.resources;
  var clients = [];

  resources.forEach(function (rSource) {
    clients.push(resource.createResource(rSource, service.imports));
  });

  var hbsFilePath = path.join(appRoot, 'public/templates', invocationKey, 'client.hbs');
  var hbsFileContents = fs.readFileSync(hbsFilePath).toString('utf-8');
  var template = hbs.handlebars.compile(hbsFileContents);

  var model = {
    constructorName: utils.alphaNumOnly(utils.capitalizeFirstLetter(service.name)),
    clients: clients
  };

  return new Promise(function (resolve) {
    resolve([{
      name: service.name + '.js',
      dir: 'app/api/' + service.name,
      contents: template(model)
    }]);
  });


}

module.exports = {
  generate: generate
};
