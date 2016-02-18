/*global describe, it */
import expect from 'expect';

import { generate } from '../lib/generators/5.x.x';

describe('node 5.x.x client', () => {
  it('should pass', () => {
    const generatedClient = generate({});
    expect(generatedClient).toEqual('The 5.x.x client\n');
  });
});
