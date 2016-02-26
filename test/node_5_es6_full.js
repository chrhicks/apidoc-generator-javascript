/*global describe, before, it */
import fs from 'fs';
import expect from 'expect';
import mkdirp from 'mkdirp';

import { generate } from '../lib/generators/node_5_es6';

const CLIENT_HOST = 'http://localhost:9020';

var client;

describe('node node_5_es6 client (FULL)', () => {
  before(() => {
    return generateClient().then(() => {
      const Client = require('./dist/full/client.js').default;
      const auth = { user: 'node_5_es6' };
      const headers = { 'test-header': 'test-header-value' };

      client = new Client(CLIENT_HOST, auth, headers);
    });
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
