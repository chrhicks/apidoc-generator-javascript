import request from 'request';

const showLogMessages = process.env.NODE_DEBUG ? process.env.NODE_DEBUG.indexOf('apidoc') !== -1 : false;

/**
 * Simple plain object check. This is actually really involved to be 100%
 * accurate
 */
export function isObject (obj) {
  return typeof obj === 'object' && !Array.isArray(obj);
}

function log (message) {
  if (showLogMessages) {
    console.log('[apidoc] ' + message);
  }
}

function getQueryString (options) {
  var params = [];
  var qs = options.qs || {};

  for (var key in qs) {
    if (qs[key]) {
      params.push(key + '=' + qs[key]);
    }
  }

  return params.join('&');
}

export function doRequest (options) {
  var startMs = Date.now();
  options = options || {};

  if (!options.json) {
    options.json = true;
  }

  options.qsStringifyOptions = {
    arrayFormat: 'repeat'
  };

  var queryString = getQueryString(options);
  var url = options.uri + (queryString ? '?' + queryString : '');

  log(options.method + ' ' + url);
  if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
    log('|--> With body:\n\t\t' + JSON.stringify(options.json));
  }

  return new Promise(function (resolve, reject) {
    request(options, function (err, response) {
      if (err) {
        reject(err);
        return;
      }

      var duration = Date.now() - startMs;
      var requestHref = response.request ? response.request.href : '<unknown url>';

      log('Completed ' + options.method + ' ' + requestHref + ' ' + response.statusCode + ' ' + duration + 'ms');

      resolve(response);
    });
  });
}
