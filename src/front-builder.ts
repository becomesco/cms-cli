import * as path from 'path';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Options } from './interfaces/options';
import { JobHandler } from './util/job-handelr';
import { GeneralUtil } from './util/general';
import { BCMSClient, KeyMethod, BCMSTemplate } from '@becomes/cms-client';
import { CLIConfig } from './enums/configuration';
import { GatsbyEntryConfig } from './interfaces/gatsby';

const { projectInstall } = require('pkg-install');

export class CMSFrontBuilder {
  public static async build(options: Options) {
    options = await this.promptForMissingOptions(options);
    const client = await BCMSClient.instance(
      options.frontConfig.cmsURL,
      {
        id: options.frontConfig.api.key,
        secret: options.frontConfig.api.secret,
      },
      false,
    );
    const templates: BCMSTemplate[] = [];
    {
      const templateKeys = await client.keyAccess.templates.filter(async (t) =>
        t.methods.find((e) => e === KeyMethod.GET),
      );
      for (const i in templateKeys) {
        const template = await client.template(templateKeys[i]._id).get();
        templates.push(template);
      }
    }
    try {
      await JobHandler.exec([
        {
          title: 'Copy project files.',
          task: async () => {
            await GeneralUtil.copyFiles(options.templateDir, options.outputDir);
          },
        },
        {
          title: 'Initialize git',
          task: () => {
            return GeneralUtil.initGit(options.outputDir);
          },
        },
        {
          title: 'Create Entry configuration file.',
          task: async () => {
            if (options.conf === CLIConfig.GATSBY) {
              const entryConfig: GatsbyEntryConfig[] = templates.map(
                (template) => {
                  return {
                    name: template.name.replace(/-/g, '_'),
                    parse: true,
                    templateId: template._id,
                  };
                },
              );
              await GeneralUtil.writeFile(
                path.join(options.outputDir, 'bcms-entry.config.js'),
                `module.exports = ${JSON.stringify(entryConfig, null, '  ')
                  .replace(/  "/g, '  ')
                  .replace(/": /g, ': ')}`,
              );
            }
          },
        },
        {
          title: 'Create Page Parser configuration file.',
          task: async () => {
            if (options.conf === CLIConfig.GATSBY) {
              const indexTemplate: string = `@t{
                @t@tpage: '/templates/@templateName/index.js',
                @t@tcreate: (createPage, component, bcms) => {
                @t@t@tcreatePage({
                @t@t@t@tcomponent,
                @t@t@t@tpath: \`/@templateName\`,
                @t@t@t@tcontext: {
                @t@t@t@t@tentries: JSON.stringify(bcms.@templateName.map(e => {
                @t@t@t@t@t@treturn {
                @t@t@t@t@t@t@ten: e.en.meta,
                @t@t@t@t@t@t}
                @t@t@t@t@t}))
                @t@t@t@t}
                @t@t@t})
                @t@t}
                @t}`;
              const itemTemplate: string = `@t{
                @t@tpage: '/templates/@templateName/single.js',
                @t@tcreate: (createPage, component, bcms) => {
                @t@t@tbcms.@templateName.forEach((e) => {
                @t@t@t@tcreatePage({
                @t@t@t@t@tcomponent,
                @t@t@t@t@tpath: \`/@templateName/\${e.en.meta.slug}\`,
                @t@t@t@t@tcontext: {
                @t@t@t@t@t@tentry: JSON.stringify(e)
                @t@t@t@t@t}
                @t@t@t@t})
                @t@t@t})
                @t@t}
                @t}`;
              const items: string[] = templates.map((template) => {
                return [
                  indexTemplate
                    .replace(/  /g, '')
                    .replace(/@templateName/g, template.name.replace(/-/g, '_'))
                    .replace(/@t/g, '  '),
                  itemTemplate
                    .replace(/  /g, '')
                    .replace(/@templateName/g, template.name.replace(/-/g, '_'))
                    .replace(/@t/g, '  '),
                ].join(',\n');
              });
              await GeneralUtil.writeFile(
                path.join(options.outputDir, 'bcms-page-parser.config.js'),
                `module.exports = [${items.join(',\n')}]`,
              );
            }
          },
        },
        {
          title: 'Create Template files.',
          task: async () => {
            for (const i in templates) {
              const template = templates[i];
              await GeneralUtil.mkdir(
                path.join(
                  options.outputDir,
                  'src',
                  'templates',
                  template.name.replace(/-/g, '_'),
                ),
              );
              await GeneralUtil.writeFile(
                path.join(
                  options.outputDir,
                  'src',
                  'templates',
                  template.name.replace(/-/g, '_'),
                  'index.js',
                ),
                `import React from "react"
                import { Link } from "gatsby"
                import Layout from "../../components/global/layout";

                export default (props) => {
                  @tconst entries = JSON.parse(props.pageContext.entries);
                  @treturn (
                  @t@t<Layout>
                  @t@t@t{entries.map(e => { return (<Link to={window.location.pathname + '/' + e.en.slug}>{e.en.title}</Link><br />)})}
                  @t@t</Layout>
                  @t)
                }`
                  .replace(/  /g, '')
                  .replace(/@t/g, '  '),
              );
              await GeneralUtil.writeFile(
                path.join(
                  options.outputDir,
                  'src',
                  'templates',
                  template.name.replace(/-/g, '_'),
                  'single.js',
                ),
                `import React from "react"
                import Layout from "../../components/global/layout";

                export default (props) => {
                  @tconst entry = JSON.parse(props.pageContext.entry);
                  @treturn (
                  @t@t<Layout>
                  @t@t@t<pre><code>{JSON.stringify(entry, null, '@t')}</code></pre>
                  @t@t</Layout>
                  @t)
                }`
                  .replace(/  /g, '')
                  .replace(/@t/g, '  '),
              );
            }
          },
        },
        {
          title: 'Create environment file.',
          task: async () => {
            await GeneralUtil.writeFile(
              path.join(options.outputDir, '.env'),
              `
              API_ORIGIN=${options.frontConfig.cmsURL}
              API_KEY=${options.frontConfig.api.key}
              API_SECRET=${options.frontConfig.api.secret}
              `.replace(/  /g, ''),
            );
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
    console.log('%s Becomes CMS project is ready.', chalk.green.bold('DONE'));
  }

  private static async promptForMissingOptions(
    options: Options,
  ): Promise<Options> {
    const questions: any[] = [
      {
        type: 'input',
        name: 'cmsURL',
        message: 'Insert BCMS URL:',
        default: 'http://localhost:1283',
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'Insert API Key ID:',
        default: '5e19a4359e19d30011656b9e',
      },
      {
        type: 'password',
        name: 'apiSecret',
        message: 'Insert API Key secret:',
        default: 'hatK0FN/VGCdp5nS5OlJVqRgwsua3nb4',
      },
    ];
    const answers: {
      cmsURL: string;
      apiKey: string;
      apiSecret: string;
    } = await inquirer.prompt(questions);
    options.frontConfig = {
      cmsURL: answers.cmsURL,
      api: {
        key: answers.apiKey,
        secret: answers.apiSecret,
      },
    };
    return options;
  }
}
