/*global describe, before, it */
import fs from 'fs';
import expect from 'expect';
import mkdirp from 'mkdirp';

import { generate } from '../lib/generators/node_5_es6';

const CLIENT_HOST = 'http://localhost:9020';

var client;
var utils;

describe('node node_5_es6 client (FULL)', () => {
  before(() => {
    if (client) {
      return client;
    } else {
      return setupClient();
    }
  });

  it('should have access to client', () => {
    expect(client.getHost()).toEqual(CLIENT_HOST);
  });

  it('should have expected resource classes', () => {
    expect(client.Flights).toBeA('object');
    expect(client.Users).toBeA('object');
  });

  it('should POST /users with basic auth', (done) => {
    postUser({
      id: '12343',
      email: '12343@test.com',
      discriminator: 'guest_user'
    })
    .then(() => {
      done();
    })
    .catch((error) => done(error));
  });

  it('should give error when no discriminator present (will timeout if failing)', (done) => {
    postUser({
      id: '99999',
      email: '99999@test.com'
    })
    .then(() => {
      done(new Error('Got success when testing for failure!'));
    })
    .catch((error) => {
      expect(error.message).toEqual('options.data.discriminator must be defined. Available options for [user] are: registered_user, guest_user, system_user, string');
      done();
    });
  });

  it('should POST /users with an enum user (as string)', (done) => {
    postUser('system')
    .then(() => done())
    .catch((error) => done(error));
  });

  it('should POST /users with an enum user (with discriminator)', (done) => {
    postUser({
      discriminator: 'system_user',
      value: 'anonymous'
    })
    .then(() => done())
    .catch((error) => done(error));
  });

  it('should GET /users which requires a header', (done) => {
    client.Users.get()
      .then(() => {
        done();
      })
      .catch((error) => done(error));
  });
});

describe('node node_5_es6 utils', () => {
  before(() => {
    if (client) {
      utils = require('./dist/full/utils.js');
      return client;
    } else {
      return setupClient().then(() => {
        utils = require('./dist/full/utils.js');
      });
    }
  });

  it('should have required utils', () => {
    expect(utils).toBeA('object');
  });

  it('should generate a query string', () => {
    const opts = {
      qs: {
        parameter1: 'value1',
        'parameter-two': 'value-two'
      }
    };
    const result = utils.getQueryString(opts);

    expect(result).toEqual('parameter1=value1&parameter-two=value-two');
  });

  it('should generate a an empty query string', () => {
    const opts = {};
    const result = utils.getQueryString(opts);

    expect(result).toEqual('');
  });

  it('should be able to determine if it is an object (array)', () => {
    const arr = [1,2,3];
    expect(utils.isObject(arr)).toEqual(false);
  });

  it('should be able to determine if it is an object (primitive)', () => {
    const str = 'hello!';
    expect(utils.isObject(str)).toEqual(false);
  });

  it('should be able to determine if it is an object (obj)', () => {
    const obj = {};
    expect(utils.isObject(obj)).toEqual(true);
  });

  it('should get types for union type', () => {
    expect(utils.getTypesForUnion('user'))
      .toEqual(['registered_user', 'guest_user', 'system_user', 'string']);
  });

  it('should convert javascript type to apidoc type (primitive)', () => {
    expect(utils.getApidocTypeForPrimitive ('string', 'hello'))
      .toEqual('string');
  });

  it('should convert javascript type to apidoc type (enum)', () => {
    expect(utils.getApidocTypeForPrimitive ('user', 'system'))
      .toEqual('system_user');
  });
});

function setupClient () {
  return generateClient().then(() => {
    const Client = require('./dist/full/client.js').default;
    const auth = { user: 'node_5_es6' };
    const headers = { 'test-header': 'test-header-value' };

    client = new Client(CLIENT_HOST, auth, headers);
  });
}

function generateClient () {
  const json = fs.readFileSync(`${process.cwd()}/reference-api/api-full-service.json`).toString('utf-8');
  mkdirp.sync(`${process.cwd()}/test/dist/full`);
  return generate(JSON.parse(json))
    .then((clientFiles) => {
      clientFiles.forEach((file) => {
        fs.writeFileSync(`${process.cwd()}/test/dist/full/${file.name}`, file.contents);
      });
      return Promise.resolve();
    });
}

function postUser (data) {
  return client.Users.post({ data });
}
