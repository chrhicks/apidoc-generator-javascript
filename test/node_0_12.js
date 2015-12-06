'use strict';

var path = require('path');
var projectRoot = path.join(__dirname, '..');

var resource = require(path.join(projectRoot, 'lib/generators/0_12/resource'));
// var ApidocReferenceApi = require(path.join(projectRoot, 'reference-clients/node_0_12'));

var test = require('tape');


test('get query params from operation', function (t) {
  var operation = {
    parameters: [
      { name: 'param1', location: 'Query' },
      { name: 'second_param', location: 'Query' },
      { name: 'param3', location: 'Path' }
    ]
  };
  var actual = resource.getQueryParameters(operation);
  var expected = [
    { name: 'param1', location: 'Query' },
    { name: 'second_param', location: 'Query' }
  ];

  t.deepEqual(actual, expected, 'filter out non Query parameters');
  t.end();
});

test('generate query string params', function (t) {
  var operation = {
    parameters: [
      { name: 'param1', location: 'Query' },
      { name: 'second_param', location: 'Query' },
      { name: 'param3', location: 'Path' }
    ]
  };
  var actual = resource.getQueryParameterNames(operation);
  var expected = [
    { name: 'param1', nameCamelCase: 'param1' },
    { name: 'second_param', nameCamelCase: 'secondParam' }
  ];

  t.deepEqual(actual, expected, 'return query param model with camelcase name');
  t.end();
});

test('get declared responses', function (t) {
  var operation = {
    responses: [
      {
        'code': { 'integer': { 'value': 201 } },
        'type': 'user'
      },
      {
        'code': { 'integer': { 'value': 400 } },
        'type': 'unit'
      },
      {
        'code': { 'integer': { 'value': 409 } },
        'type': '[error]'
      }
    ]
  };
  var actual = resource.getDeclaredResponses(operation);
  var expected = [
    { code: 201, type: 'user', isUnitType: false, isResolve: true },
    { code: 400, type: 'unit', isUnitType: true, isResolve: false },
    { code: 409, type: '[error]', isUnitType: false, isResolve: false }
  ];

  t.deepEqual(actual, expected, 'response view model');
  t.end();
});

test('get resource object name', function (t) {
  var objectNameLocal = resource.getResourceObjectName('subscriptions');
  t.equal(objectNameLocal, 'Subscriptions', 'passthrough object name');
  t.end();
});


// var bodyParser = require('body-parser');
// var express = require('express');

// var app = express();
// var port = process.env.PORT || 9035;

// app.set('port', port);
// app.use(bodyParser.json());

// const testHost = `http://localhost:${port}`;
// const client = new ApidocReferenceApi(testHost);

// app.get('/echoes', function (req, res) {
//   if (!req.query.required_messages) {
//     res.status(400).send();
//     return;
//   }
//   res.status(204).send();
// });

// const testServer = app.listen(port, function () {
//   console.log('test server running on port %s', port);

//   setTimeout(function () {
//     testServer.close(function () {
//       console.log('test server shut down');
//     });
//   }, 1000);

// });

/**
 * Heavily modified blue-tape implementation to allow this code to handle
 * promise rejections.
 */
// test.Test.prototype.run = function () {
//     if (this._skip)
//         return this.end();
//     this.emit('prerun');
//     try {
//       this._cb(this);
//     } catch (err) {
//       err ? this.error(err) : this.fail(err);
//       this.end();
//       return;
//     }
//     this.emit('run');
// };

// test('a GET request with query params', function (t) {
//   client.Echo.get({
//     foo: 'foo',
//     optionalMessages: 'optional_messages',
//     requiredMessages: 'required_messages'
//   }).then(function (response) {
//     t.equal(response.status, 204, 'response should be 204');
//     t.notOk(response.data, 'response data does not exist');
//     t.end();
//   }).catch(function (err) {
//     t.error(err);
//     t.end();
//   });
// });

// test('a GET request without required query param', function (t) {
//   client.Echo.get({
//     foo: 'foo',
//     optionalMessages: 'optional_messages'
//   }).then(function () {
//     t.fail('The promise was supposed to be rejected.');
//     t.end();
//   }).catch(function (err) {
//     // Should be a 400 bad request.
//     t.ok(err.stack, 'client rejected promise');
//     t.end();
//   });
// });








