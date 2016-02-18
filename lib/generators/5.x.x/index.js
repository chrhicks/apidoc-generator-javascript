import path from 'path';
import fs from 'fs';
import hbs from 'hbs';

const INVOCATION_KEY = '5.x.x';
const TEMPLATE_LOCATION = path.join(process.cwd(), `public/templates/${INVOCATION_KEY}/client.hbs`);

function getTemplate() {
  return hbs.handlebars.compile(fs.readFileSync(TEMPLATE_LOCATION).toString('utf-8'));
}

export function generate (service) {
  const template = getTemplate();

  return template({});
}
