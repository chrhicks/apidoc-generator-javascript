'use strict';
var path = require('path');
var root = path.join(__dirname);
var fs = require('fs');
var utils = require('./lib/utils');

var bodyParser = require('body-parser');
var express = require('express');
var hbs = require('hbs');
var _ = require('lodash');
var app = express();
var port = process.env.PORT || 9030;

var resource = require('./lib/resource');

app.set('port', (process.env.PORT || port));
app.use(bodyParser.json());

var generators = [
  {
    key: 'node_0_12',
    name: 'Node (0.12.x)',
    language: 'JavaScript',
    description: 'Node client using the request http lib'
  }
];

app.get('/generators', function (req, res) {
  var offset = req.query.offset || 0;
  var limit = req.query.limit || 10;

  res.send(_.take(_.drop(generators, offset), limit));
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

  if (!generator) {
    res.status(409).send([
      {
        code: 'GENERATOR_NOT_FOUND',
        message: 'Could not find generator with key: ' + invocationKey
      }
    ]);

    return;
  }

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

  var fileContents = template(model);

  if (process.env.NODE_ENV === 'development') {
    fs.writeFileSync('./out/' + service.name + '.js', fileContents);
  }

  res.send({
    source: '',
    files: [
      {
        name: service.name + '.js',
        dir: 'app/api/' + service.name,
        contents: fileContents
      }
    ]
  });
});

app.listen(port, function () {
  console.log('apidoc-javascript-generator running on port %s', port);
});
