import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const calloutTemplate = readFileSync(
    resolve(__dirname, 'templates/partials/callout.hbs'),
    'utf8'
);

Handlebars.registerPartial('callout', Handlebars.compile(calloutTemplate));

globalThis.Handlebars = Handlebars;
