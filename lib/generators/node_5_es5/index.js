import { generate as es6Generate } from '../node_5_es6';

const babel = require('babel-core');

export function generate (service) {
  return es6Generate(service)
    .then((files) => {
      return files.map((file) => {
        if (file.name.endsWith('.js')) {
          const contents = babel.transform(file.contents,
          {
            presets: ['es2015']
          }).code;
          return Object.assign({}, file, { contents });
        }
        return file;
      });
    });
}
