'use strict';
var path = require('path');
var root = path.join(__dirname);
var fs = require('fs');
var util = require('util');
var utils = require('./lib/utils');

var bodyParser = require('body-parser');
var express = require('express');
var hbs = require('hbs');
var _ = require('lodash');
var app = express();
var port = 9030;

var resource = require('./lib/resource');

app.set('port', (process.env.PORT || port));
app.use(bodyParser.json());

// hbs.registerPartials(path.join(root, 'public/templates/node_request/partials'));

var generators = [
  {
    key: 'node_request',
    name: 'Node Client',
    language: 'JavaScript',
    description: 'Node client using the request http lib'
  }
];

app.get('/generators', function (req, res) {
  console.log(req.query);
  res.send(_.take(_.drop(generators, req.query.offset), req.query.limit));
});

app.get('/generators/:key', function (req, res) {
  var generator = _.find(generators, { key: req.params.key });

  if (generator) {
    res.send(generator);
  } else {
    res.status(404).send();
  }

});

app.get('/_internal_/healthcheck', function (req, res) {
  res.send('healthy');
});

app.post('/invocations/:key', function (req, res) {
  var invocationKey = req.params.key;
  var service = req.body.service;
  var resources = service.resources;
  var clients = [];
  var generator = _.find(generators, { key: req.params.key });

// console.log('attempting to get service', service);
//
  if (!generator) {
    res.status(409).send([
      {
        code: 'GENERATOR_NOT_FOUND',
        message: 'Could not find generator with key: ' + invocationKey
      }
    ]);

    return;
  }
// console.log('resources', util.inspect(resources, false, 3));
  resources.forEach(function (rSource) {
    clients.push(resource.createResource(rSource));
  });

  var hbsFilePath = path.join(root, 'public/templates', invocationKey, 'client.hbs');
  var hbsFileContents = fs.readFileSync(hbsFilePath).toString('utf-8');
  var template = hbs.handlebars.compile(hbsFileContents);

  var model = {
    constructorName: utils.capitalizeFirstLetter(service.name),
    clients: clients
  };

  console.log(util.inspect(model, false, 5, true));

  res.send({
    source: '',
    files: [
      {
        name: service.name + '.js',
        dir: 'app/api/' + service.name,
        contents: template(model)
      }
    ]
  });
});

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
