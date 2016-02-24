import { generate as es6Generate } from '../node_5_es6';

const babel = require('babel-core');

export function generate (service) {
  const files = es6Generate(service);

  return files.map((file) => {
    const contents = babel.transform(file.contents,
    {
      presets: ['es2015']
    }).code;
    return Object.assign({}, file, { contents });
  });
}
