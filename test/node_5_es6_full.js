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
      client = new Client(CLIENT_HOST, auth);
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
    .then((user) => {
      done();
    })
    .catch((error) => {
      done(error);
    });
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
