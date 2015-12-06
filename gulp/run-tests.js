/*global require, process*/

'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var env = process.env.NODE_ENV || 'test';
var reporter;

if ('test' === env) {
  reporter = 'nyan';
}

if ('ci' === env) {
  reporter = 'spec';
}

gulp.task('run-tests', ['generate-clients'], function (done) {
  gulp.src('test/**/*.js', {read: false})
    .pipe(mocha({reporter: reporter}))
    .once('end', function () {
      done();
    });
});

/**
 * Generate clients before running tests against them.
 */
gulp.task('generate-clients', function generateClients () {
  mkdirp.sync('reference-clients');

  var referenceService = require('../reference-api/subscriptions.json');
  var generatorMeta = require('../generators.json').map(function (meta) {
    var generatorPath = meta.key.replace('node_', '../lib/generators/');
    var generatorModule = require(generatorPath);
    meta.module = generatorModule;
    return meta;
  });

  generatorMeta.forEach(function (meta) {
    var generatedCode = meta.module.generate(referenceService);
    mkdirp.sync(`reference-clients/${meta.key}`);
    fs.writeFileSync(`reference-clients/${meta.key}/index.js`, generatedCode);
  });
});

