#!/usr/bin/env node  

import { performance } from 'perf_hooks';
import fg from 'fast-glob';
import { writeReadme } from './src/write-readme.js';
import { endMessage } from './src/end-message.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <filename or glob> <root> [options]\nGlob can be a comma separated list. Glob needs to be wrapped in quotes.')
  .boolean(['to-console', 'force'])
  .describe('ignore', 'A filename or glob to exclude. You can comma separate a list. Make sure to wrap globs in quotes.')
  .describe('to-console', 'Outputs props table to command line instead of readme.')
  .describe('force', 'Overwrite the current readme if it exists and start and end comments are missing.')
  .demandCommand(2, 'You need to provide a filename or glob to generate the documentation from and a root path to calculate imports from.')
  .alias('h', 'help')
  .alias('v', 'version')
  .argv

const filenames = argv._[0].split(',');
const root = argv._[1];
const ignore = argv['ignore'] ? argv['ignore'].split(',') : [];
const toConsole = argv['to-console'];
const force = argv.force;
const regex = /<!-- js-doc-md-start -->[\s\S]*<!-- js-doc-md-end -->/m;

const startTime = performance.now();

const stream = fg.stream(filenames, { ignore });
const entries = [];
const success = [];
const errors = [];
const warnings = [];

stream.on('data', (filename) => entries.push(filename));
stream.once('error', console.log);
stream.once('end', () => {
  Promise.all(entries.map(filename =>
    writeReadme(filename, root, toConsole, regex, force)
      .then((result) => result === 'Ignored' ? warnings.push(filename) : success.push(filename))
      .catch((e) => {
        if (e !== 'Warning') {
          errors.push(filename);
        } else {
          warnings.push(filename);
        }
      })
  )).then(
    () => {
      endMessage(startTime, entries.length, success, errors, warnings);
    }
  );
});
