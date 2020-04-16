import * as path from 'path';
import * as arg from 'arg';
import { Options } from '../interfaces/options';
import { CLIConfig } from '../enums/configuration';

export class ArgParser {
  public static parse(rawArgs: string[]): Options {
    const args = arg(
      {
        '--help': Boolean,
        '--atlas': Boolean,
        '--name': String,
        '--ngit': Boolean,
        '--custom_front': Boolean,
        '--conf': String,
        '--port': Number,
        '-h': '--help',
        '-a': '--atlas',
        '-n': '--name',
        '-p': '--port',
        '-ng': '--ngit',
        '-cf': '--custom_front',
        '-c': '--conf',
      },
      {
        argv: rawArgs.slice(2),
      },
    );
    const options: Options = {
      help: args['--help'] || false,
      atlas: args['--atlas'] || false,
      name: args['--name'] || 'bcms-project',
      port: args['--port'] || 1280,
      templateDir: this.confToTemplateDir(args['--conf'] || 'cms'),
      ngit: args['--ngit'] || true,
      customFront: args['--custom_front'] || false,
      conf: this.parseConf(args['--conf'] || 'cms'),
    };
    options.outputDir = path.join(process.env.PROJECT_ROOT, options.name);
    return options;
  }

  private static parseConf(conf: string) {
    if (CLIConfig[conf.toUpperCase()]) {
      return CLIConfig[conf.toUpperCase()];
    }
    return CLIConfig.CMS;
  }

  private static confToTemplateDir(conf: string): string {
    switch (conf.toUpperCase()) {
      case CLIConfig.GATSBY: {
        return path.join(
          __dirname,
          '..',
          'starters',
          'frontend',
          'gatsby',
          'basic',
        );
      }
      default: {
        return path.join(__dirname, '..', 'starters', 'cms', 'basic');
      }
    }
  }
}
