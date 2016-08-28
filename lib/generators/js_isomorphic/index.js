import apidoc from '@flowio/lib-apidoc';

export function generate (service) {
  const client = apidoc.codegen.generate(service);
  return Promise.resolve(client.files.map((file) => ({ name: file.path, contents: file.contents })));
}
