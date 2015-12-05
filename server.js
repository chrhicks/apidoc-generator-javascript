'use strict';
var bodyParser = require('body-parser');
var express = require('express');
var _ = require('lodash');

var app = express();
var port = process.env.PORT || 9030;

// var resource = require('./lib/resource');
var node12Generator = require('./lib/generators/0_12');


app.set('port', port);
app.use(bodyParser.json());

var generators = [
  {
    key: 'node_0_12',
    name: 'Node (0.12.x)',
    language: 'JavaScript',
    description: 'Node client using the request http lib'
  }
];

var generatorModules = {
  'node_0_12': node12Generator
};

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
  var generatorMeta = _.find(generators, { key: invocationKey });

  if (!generatorMeta) {
    res.status(409).send([
      {
        code: 'GENERATOR_NOT_FOUND',
        message: 'Could not find generator with key: ' + invocationKey
      }
    ]);

    return;
  }

  var generator = generatorModules[invocationKey];
  var service = req.body.service;
  var fileContents = generator.generate(service);

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
