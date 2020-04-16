import * as crypto from 'crypto';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Options } from './interfaces/options';
import { JobHandler } from './util/job-handelr';
import { GeneralUtil } from './util/general';
import { Assets } from './util/assets';
const { projectInstall } = require('pkg-install');

export class CMSBuilder {
  private static readonly writeFile = util.promisify(fs.writeFile);
  private static readonly mkdir = util.promisify(fs.mkdir);

  public static async build(options: Options) {
    options = await this.promptForMissingOptions(options);
    try {
      await JobHandler.exec([
        {
          title: 'Copy project files',
          task: () => {
            return GeneralUtil.copyFiles(
              options.templateDir,
              options.outputDir,
            );
          },
        },
        {
          title: 'Initialize git',
          task: () => {
            return GeneralUtil.initGit(options.outputDir);
          },
        },
        {
          title: 'Create BCMS configuration file.',
          task: async () => {
            return this.writeFile(
              path.join(options.outputDir, 'bcms-config.js'),
              `module.exports = ${JSON.stringify(Assets.BCMSConfig, null, '  ')
                .replace('"@PORT"', 'process.env.PORT')
                .replace('"@JWT_SECRET"', 'process.env.JWT_SECRET')
                .replace(
                  '@DB_TYPE',
                  `${
                    options.db.cluster === ''
                      ? 'MONGO_SELF_HOSTED'
                      : 'MONGO_ATLAS'
                  }`,
                )
                .replace('"@DB_HOST"', 'process.env.DB_HOST')
                .replace('"@DB_PORT"', 'process.env.DB_PORT')
                .replace('"@DB_NAME"', 'process.env.DB_NAME')
                .replace('"@DB_USER"', 'process.env.DB_USER')
                .replace('"@DB_PASS"', 'process.env.DB_PASS')
                .replace('@DB_PRFX', options.db.prfx)
                .replace('"@DB_CLUSTER"', 'process.env.DB_CLUSTER')}`,
            );
          },
        },
        {
          title: 'Create APP environment file.',
          task: async () => {
            await this.writeFile(
              path.join(options.outputDir, 'app.env'),
              `PORT=${options.port}
        
              DB_HOST=${options.db.host}
              DB_PORT=${options.db.port}
              DB_NAME=${options.db.name}
              DB_USER=${options.db.user}
              DB_PASS=${options.db.pass}
              ${
                options.db.cluster !== ''
                  ? `DB_CLUSTER=${options.db.cluster}`
                  : ''
              }
        
              JWT_SECRET=${crypto.randomBytes(32).toString('base64')}
              `.replace(/  /g, ''),
            );
          },
        },
        {
          title: 'Create Docker utility scripts.',
          task: async () => {
            await this.writeFile(
              path.join(options.outputDir, 'docker-start.sh'),
              Assets.dockerSH
                .replace('@port', `${options.port}`)
                .replace('@appName', 'bcms'),
            );
            await this.writeFile(
              path.join(options.outputDir, 'docker-clear.sh'),
              Assets.dockerClearSH
                .replace('@port', `${options.port}`)
                .replace('@appName', 'bcms'),
            );
            await JobHandler.process(
              `cd ${options.outputDir} && chmod 755 docker-start.sh`,
            );
            await JobHandler.process(
              `cd ${options.outputDir} && chmod 755 docker-clear.sh`,
            );
          },
        },
        {
          title: 'Create .gitignore.',
          task: async () => {
            await this.writeFile(
              path.join(options.outputDir, '.gitignore'),
              Assets.CMSGitIgnore,
            );
          },
        },
        {
          title: 'Initialize custom portal.',
          task: async () => {
            if (options.customFront === true) {
              await this.mkdir(path.join(process.env.PROJECT_ROOT, 'frontend'));
              await this.writeFile(
                path.join(process.env.PROJECT_ROOT, 'frontend', 'main.js'),
                `
              import App from './App.svelte';
              const app = new App({
                target: document.body,
              });
              export default app;`.replace(/  /g, ''),
              );
              await this.writeFile(
                path.join(process.env.PROJECT_ROOT, 'frontend', 'App.svelte'),
                `<h1>Custom CMS Front-end</h1>`,
              );
            }
          },
        },
        {
          title: 'Install dependencies',
          task: () =>
            projectInstall({
              cwd: options.outputDir,
            }),
        },
      ]);
    } catch (error) {
      console.error(error);
      return;
    }
    // tslint:disable-next-line:no-console
    console.log('%s Becomes CMS project is ready.', chalk.green.bold('DONE'));
  }

  private static async promptForMissingOptions(
    options: Options,
  ): Promise<Options> {
    let questions: any[] = [
      {
        type: 'input',
        name: 'name',
        message: 'Insert database name:',
        default: 'bcms_db',
      },
      {
        type: 'input',
        name: 'user',
        message: 'Insert database username:',
        default: 'bcms',
      },
      {
        type: 'password',
        name: 'pass',
        message: 'Insert database password:',
        default: 'my-db-password',
      },
      {
        type: 'input',
        name: 'prefix',
        message: 'Insert database collection prefix:',
        default: 'bcms',
      },
    ];
    if (options.atlas === true) {
      questions = [
        ...questions,
        {
          type: 'input',
          name: 'cluster',
          message: 'Insert database cluster name:',
          default: 'atlas-cluster',
        },
      ];
      const answers: {
        name: string;
        user: string;
        pass: string;
        prefix: string;
        cluster: string;
      } = await inquirer.prompt(questions);
      options.db = {
        host: '',
        port: '',
        name: answers.name,
        pass: answers.pass,
        user: answers.user,
        prfx: answers.prefix,
        cluster: answers.cluster,
      };
    } else {
      questions = [
        ...questions,
        {
          type: 'input',
          name: 'host',
          message: 'Insert database host name:',
          default: 'localhost',
        },
        {
          type: 'number',
          name: 'port',
          message: 'Insert database port:',
          default: 27017,
        },
      ];
      const answers: {
        host: string;
        port: number;
        name: string;
        user: string;
        pass: string;
        prefix: string;
      } = await inquirer.prompt(questions);
      options.db = {
        host: answers.host,
        port: `${answers.port}`,
        name: answers.name,
        user: answers.user,
        pass: answers.pass,
        prfx: answers.prefix,
        cluster: '',
      };
    }
    return options;
  }
}
