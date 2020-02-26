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
import { Assets } from './assets';

// tslint:disable-next-line:no-var-requires
const { projectInstall } = require('pkg-install');
const copyFile = util.promisify(fs.copyFile);
const copy = util.promisify(ncp);
const save = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const configFile = {
  frontend: {
    custom: undefined,
    build: false,
  },
  server: {
    port: '@PORT',
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
          pass: '@DB_PASSWORD',
          prefix: 'bcms',
          cluster: '',
        },
      },
    },
    git: {
      install: false,
      use: false,
      email: 'user-email',
      username: 'username',
      password: '@GIT_PASSWORD',
      host: 'git-host',
      repo: 'git-repo',
      repo_owner: 'git-repo-owner',
      branch: 'git-repo-branch',
    },
    env: {},
  },
};
const envFileConfig = {
  PORT: 1280,
  DB_PASSWORD: 'my-db-password',
  GIT_PASSWORD: 'git-password',
};

function parseArgsIntoOptions(
  rawArgs,
): {
  help: boolean;
  atlas: boolean;
  name: string;
  templateDir: string;
  ngit: boolean;
} {
  const args = arg(
    {
      '--help': Boolean,
      '--atlas': Boolean,
      '--name': String,
      '--ngit': Boolean,
      '--custom_front': Boolean,
      '-h': '--help',
      '-a': '--atlas',
      '-n': '--name',
      '-ng': '--ngit',
      '-cf': '--custom_front',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    help: args['--help'] || false,
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
      pass: '@DB_PASSWORD',
      prefix: answers.prefix,
      cluster: answers.cluster,
    };
    envFileConfig.DB_PASSWORD = answers.pass;
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
      pass: '@DB_PASSWORD',
      prefix: answers.prefix,
      cluster: undefined,
    };
    envFileConfig.DB_PASSWORD = answers.pass;
  }
  if (options.custom_front === true) {
    configFile.frontend.custom.path = '/frontend';
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
  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
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
  if (options.custom_front === true) {
    await mkdir(path.join(process.env.PROJECT_ROOT, 'frontend'));
    await save(
      path.join(process.env.PROJECT_ROOT, 'frontend', 'main.js'),
      `
    import App from './App.svelte';
    const app = new App({
      target: document.body,
    });
    export default app;`.replace(/  /g, ''),
    );
    await save(
      path.join(process.env.PROJECT_ROOT, 'frontend', 'App.svelte'),
      `<h1>Custom CMS Front-end</h1>`,
    );
  }
  await save(
    path.join(options.outputDir, 'bcms-config.js'),
    `module.exports = ${JSON.stringify(options.config, null, '  ')
      .replace('"@PORT"', 'process.env.PORT')
      .replace('"@DB_PASSWORD"', 'process.env.DB_PASSWORD')
      .replace('"@GIT_PASSWORD"', 'process.env.GIT_PASSWORD')
      .replace(/":/g, ':')
      .replace(/  "/g, '  ')}`,
  );
  await save(
    path.join(options.outputDir, '.env'),
    `PORT=${envFileConfig.PORT}
    DB_PASSWORD=${envFileConfig.DB_PASSWORD}
    GIT_PASSWORD=${envFileConfig.GIT_PASSWORD}`.replace(/  /g, ''),
  );
  await save(
    path.join(options.outputDir, '.gitignore'),
    Assets.gitIgnore,
  );
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
function printHelp() {
  // tslint:disable-next-line:no-console
  console.log(`
  --------------------------------------------------------
  Becomes CMS CLI - Help

  --help        - Prints this message.
  --name [NAME] - Name of project/directory that will be
                  created for CMS.
  --atlas       - Use MongoDB Atlas as a database for CMS.
                  By default, CMS is using self-hosted
                  MongoDB database.
  -------------------------------------------------------`);
}

export async function cli(args) {
  let options = parseArgsIntoOptions(args);
  process.env.PROJECT_ROOT = process.cwd();
  if (options.help === true) {
    printHelp();
    return;
  }
  options = await promptForMissingOptions(options);
  configFile.server.security.jwt.secret = crypto
    .randomBytes(32)
    .toString('base64');
  await createProject(options);
}
