'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var _ = require('lodash');

var app = express();
var port = process.env.PORT || 9030;

var node12Generator = require('./lib/generators/0_12');
var node5_X_X_ES6 = require('./lib/generators/node_5_es6');
var node5_X_X_ES5 = require('./lib/generators/node_5_es5');
var jsIsomorphic = require('./lib/generators/js_isomorphic');


app.set('port', port);
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static('public'));

var generators = require('./generators');

var generatorModules = {
  'node_0_12': node12Generator,
  'node_5_es6': node5_X_X_ES6,
  'node_5_es5': node5_X_X_ES5,
  'js_isomorphic': jsIsomorphic
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

  if (!service) {
      throw new Error(`service json not found for service ${invocationKey}`);
  }

  generator.generate(service).then((files) => {
    res.send({
      source: '',
      files: files
    });
  }).catch((error) => {
    console.error(`Could not generate code for ${invocationKey}: ${error.message}`);
    console.error(error.stack);
  });
});

app.listen(port, function () {
  console.log('apidoc-javascript-generator running on port %s', port);
});
