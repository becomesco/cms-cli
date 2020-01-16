import * as crypto from 'crypto';
import * as fs from 'fs';
import * as arg from 'arg';
import * as path from 'path';
import * as chalk from 'chalk';
import * as ncp from 'ncp';
import * as util from 'util';
import * as execa from 'execa';
import * as inquirer from 'inquirer';
import Listr = require('listr');

// tslint:disable-next-line:no-var-requires
const { projectInstall } = require('pkg-install');
const copy = util.promisify(ncp);
const save = util.promisify(fs.writeFile);
const configFile = {
  server: {
    port: 1280,
    security: {
      jwt: {
        secret: 'jwt-256-bit-secret',
        issuer: 'localhost',
      },
    },
    database: {
      type: 'MONGO_SELF_HOSTED',
      mongo: {
        database: {
          host: 'localhost',
          port: 27017,
          name: 'bcms_db',
          user: 'bcms',
          pass: 'my-db-password',
          prefix: 'bcms',
          cluster: '',
        },
      },
    },
    git: {
      email: 'user-email',
      username: 'username',
      password: 'user-password',
      host: 'git-host',
      repo: 'git-repo',
      repo_owner: 'git-repo-owner',
      branch: 'git-repo-branch',
    },
    env: {},
  },
};

function parseArgsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--atlas': Boolean,
      '--name': String,
      '--ngit': Boolean,
      '-a': '--atlas',
      '-n': '--name',
      '-ng': '--ngit',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    atlas: args['--atlas'] || false,
    name: args['--name'] || 'bcms-project',
    templateDir: path.join(__dirname, '/starters'),
    ngit: args['--ngit'] || false,
  };
}

async function promptForMissingOptions(options: any) {
  const questions: any[] = [];
  questions.push({
    type: 'input',
    name: 'name',
    message: 'Insert database name:',
    default: 'bcms_db',
  });
  questions.push({
    type: 'input',
    name: 'user',
    message: 'Insert database username:',
    default: 'bcms',
  });
  questions.push({
    type: 'password',
    name: 'pass',
    message: 'Insert database password:',
    default: 'my-db-password',
  });
  questions.push({
    type: 'input',
    name: 'prefix',
    message: 'Insert database collection prefix:',
    default: 'bcms',
  });
  if (options.atlas === true) {
    questions.push({
      type: 'input',
      name: 'cluster',
      message: 'Insert database cluster name:',
      default: 'atlas-cluster',
    });
    const answers: {
      name: string;
      user: string;
      pass: string;
      prefix: string;
      cluster: string;
    } = await inquirer.prompt(questions);
    configFile.server.database.type = 'MONGO_ATLAS';
    configFile.server.database.mongo.database = {
      host: undefined,
      port: undefined,
      name: answers.name,
      user: answers.user,
      pass: answers.pass,
      prefix: answers.prefix,
      cluster: answers.cluster,
    };
  } else {
    questions.push({
      type: 'input',
      name: 'host',
      message: 'Insert database host name:',
      default: 'localhost',
    });
    questions.push({
      type: 'number',
      name: 'port',
      message: 'Insert database port:',
      default: 27017,
    });
    const answers: {
      host: string;
      port: number;
      name: string;
      user: string;
      pass: string;
      prefix: string;
    } = await inquirer.prompt(questions);
    configFile.server.database.type = 'MONGO_SELF_HOSTED';
    configFile.server.database.mongo.database = {
      host: answers.host,
      port: answers.port,
      name: answers.name,
      user: answers.user,
      pass: answers.pass,
      prefix: answers.prefix,
      cluster: undefined,
    };
  }
  return {
    ...options,
    config: configFile,
  };
}

async function copyTemplateFiles(options: any) {
  return copy(options.templateDir, options.outputDir, {
    clobber: false,
  });
}

async function createProject(options: any) {
  options = {
    ...options,
    outputDir: path.join(process.env.PROJECT_ROOT, options.name),
  };
  await save(
    path.join(__dirname, 'starters', 'bcms-config.js'),
    `module.exports = ${JSON.stringify(options.config, null, '  ')}`,
  );
  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Install dependencies',
      task: () =>
        projectInstall({
          cwd: options.outputDir,
        }),
    },
  ]);
  await tasks.run();
  await save(path.join(__dirname, 'starters', 'bcms-config.js'), '');
  // tslint:disable-next-line:no-console
  console.log('%s Becomes CMS project is ready.', chalk.green.bold('DONE'));
}

async function initGit(options: any) {
  const result = await execa('git', ['init'], {
    cwd: options.outputDir,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize Git.'));
  }
  return;
}

export async function cli(args) {
  let options = parseArgsIntoOptions(args);
  process.env.PROJECT_ROOT = process.cwd();
  options = await promptForMissingOptions(options);
  configFile.server.security.jwt.secret = crypto
    .randomBytes(32)
    .toString('base64');
  await createProject(options);
}
