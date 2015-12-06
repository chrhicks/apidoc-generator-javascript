var request = require('request');

/**
 * ## Responses
 * Responses from this API with be wrapped in an envelope to assist the caller
 * in dealing with the various responses from the service. There are no types
 * to check against in JavaScript, so this facilitates that.
 *
 *    {
 *      status: 200,
 *      data: { name: "John", age: 29 }
 *    }
 *
 * ## Logging
 * To enable logging, use the NODE_DEBUG environment variable.
 *
 *    NODE_DEBUG=apidoc
 *
 * @constructor
 */
function Splashpage (host) {
  var showLogMessages = process.env.NODE_DEBUG ? process.env.NODE_DEBUG.indexOf('apidoc') !== -1 : false;

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

  function doRequest (options) {
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
        var duration = Date.now() - startMs;
        var requestHref = response.request ? response.request.href : '<unknown url>'

        log('Completed ' + options.method + ' ' + requestHref + ' ' + response.statusCode + ' ' + duration + 'ms');

        if (err) {
          reject(err);
          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * Simple plain object check. This is actually really involved to be 100%
   * accurate
   */
  function isObject (obj) {
    return typeof obj === 'object' && !Array.isArray(obj);
  }

  var Healthchecks = (function Healthchecks() {
      /**
       * 
       * 
       */
      function getHealthcheck() {


        var url = host + '/_internal_/healthcheck';
        var queryString = {
        };
        var requestOpts = {
          qs: queryString,
          uri: url,
          method: 'GET'
        };

        return doRequest(requestOpts).then(function (serverResponse) {
          switch (serverResponse.statusCode) {
            case 200:
              return Promise.resolve(serverResponse.body);
            default:
              return Promise.reject(new Error('Unknown response code: ' + serverResponse.statusCode));
          }
        });
      }

    return {
      getHealthcheck: getHealthcheck,
    };
  }());

  var Subscriptions = (function Subscriptions() {
      /**
       * Search subscriptions. Always paginated.
       * 
       * @param {Object} options
       * @param {string} options.guid
       * @param {string} options.email
       * @param {*} options.publication
       * @param {number} options.limit
       * @param {number} options.offset
       */
      function get(options) {
        // if options is not defined, set it
        options = options || {};

        // otherwise if it's not the kind of object we want...
        if (!isObject(options)) {
          return Promise.reject(new Error('options parameter is required and must be a plain object'));
        }


        var url = host + '/subscriptions';
        var queryString = {
          guid: options.guid,
          email: options.email,
          publication: options.publication,
          limit: options.limit,
          offset: options.offset,
        };
        var requestOpts = {
          qs: queryString,
          uri: url,
          method: 'GET'
        };

        return doRequest(requestOpts).then(function (serverResponse) {
          switch (serverResponse.statusCode) {
            case 200:
              return Promise.resolve(serverResponse.body);
            case 401:
              return Promise.reject({ status: serverResponse.statusCode, data: serverResponse.body });
            default:
              return Promise.reject(new Error('Unknown response code: ' + serverResponse.statusCode));
          }
        });
      }
      /**
       * Returns information about a specific subscription.
       * 
       * @param {string} guid
       */
      function getByGuid(guid) {


        var url = host + '/subscriptions/' + guid + '';
        var queryString = {
        };
        var requestOpts = {
          qs: queryString,
          uri: url,
          method: 'GET'
        };

        return doRequest(requestOpts).then(function (serverResponse) {
          switch (serverResponse.statusCode) {
            case 200:
              return Promise.resolve(serverResponse.body);
            case 401:
              return Promise.reject({ status: serverResponse.statusCode, data: serverResponse.body });
            case 404:
              return Promise.reject({ status: serverResponse.statusCode, data: serverResponse.body });
            default:
              return Promise.reject(new Error('Unknown response code: ' + serverResponse.statusCode));
          }
        });
      }
      /**
       * Create a new subscription.
       * 
       * @param {Object} options
       * @param {Object} options.data - The request body
       */
      function post(options) {
        // if options is not defined, set it
        options = options || {};

        // otherwise if it's not the kind of object we want...
        if (!isObject(options)) {
          return Promise.reject(new Error('options parameter is required and must be a plain object'));
        }

        if (!options.data) {
          return Promise.reject(new Error('options.data property is required.'));
        }

        var url = host + '/subscriptions';
        var queryString = {
        };
        var requestOpts = {
          qs: queryString,
          json: options.data,
          uri: url,
          method: 'POST'
        };

        return doRequest(requestOpts).then(function (serverResponse) {
          switch (serverResponse.statusCode) {
            case 200:
              return Promise.resolve(serverResponse.body);
            case 201:
              return Promise.resolve(serverResponse.body);
            case 409:
              return Promise.reject({ status: serverResponse.statusCode, data: serverResponse.body });
            default:
              return Promise.reject(new Error('Unknown response code: ' + serverResponse.statusCode));
          }
        });
      }
      /**
       * 
       * 
       * @param {string} guid
       */
      function deleteByGuid(guid) {


        var url = host + '/subscriptions/' + guid + '';
        var queryString = {
        };
        var requestOpts = {
          qs: queryString,
          uri: url,
          method: 'DELETE'
        };

        return doRequest(requestOpts).then(function (serverResponse) {
          switch (serverResponse.statusCode) {
            case 204:
              return Promise.resolve();
            case 401:
              return Promise.reject({ status: serverResponse.statusCode, data: serverResponse.body });
            default:
              return Promise.reject(new Error('Unknown response code: ' + serverResponse.statusCode));
          }
        });
      }

    return {
      get: get,
      getByGuid: getByGuid,
      post: post,
      deleteByGuid: deleteByGuid,
    };
  }());

  this.Healthchecks = Healthchecks;
  this.Subscriptions = Subscriptions;
}



module.exports = Splashpage;
