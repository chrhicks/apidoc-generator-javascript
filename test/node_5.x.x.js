/*global describe, it */
import fs from 'fs';
import expect from 'expect';

import { generate } from '../lib/generators/5.x.x';

const CLIENT_FILE = 'apidoc-test-light-0.0.2.js';

function generateClient() {
  const json = fs.readFileSync(`${process.cwd()}/reference-api/api-light-service.json`).toString('utf-8');
  const clientFiles = generate(JSON.parse(json));
  // fs.createReadStream(`${process.cwd()}/public/templates/5.x.x/resources/utils.js`)
  //   .pipe(fs.createWriteStream(`${process.cwd()}/test/dist/utils.js`));
  clientFiles.forEach((file) => fs.writeFileSync(`${process.cwd()}/test/dist/${file.fileName}`, file.contents));
}

generateClient();

const Client = require(`./dist/${CLIENT_FILE}`).default;
const CLIENT_HOST = 'http://localhost:9020';
const client = new Client(CLIENT_HOST);

describe('node 5.x.x client', () => {
  it('should have access to client', () => {
    expect(client.getHost()).toEqual(CLIENT_HOST);
  });

  it('should have expected resource classes', () => {
    expect(client.Flights).toBeA('object');
  });
});
