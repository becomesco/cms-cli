import * as chalk from 'chalk';
import * as ncp from 'ncp';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const access = util.promisify(fs.access);
const copy = util.promisify(ncp);

async function copyTemplateFiles(options: any) {
  return copy(options.templateDir, options.outputDir, {
    clobber: false,
  });
}

export async function createProject(options: any) {
  options = {
    ...options,
    outputDir: path.join(process.env.PROJECT_ROOT, options.name),
  };
  await copyTemplateFiles(options);
  // tslint:disable-next-line:no-console
  console.log('%s Zigmium project is ready.', chalk.green.bold('DONE'));
}
