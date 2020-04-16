import { ArgParser } from './util/arg-parser';
import { CLIConfig } from './enums/configuration';
import { CMSBuilder } from './cms-builder';
import { CMSFrontBuilder } from './front-builder';

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
  process.env.PROJECT_ROOT = process.cwd();
  const options = ArgParser.parse(args);
  if (options.help === true) {
    printHelp();
    return;
  }
  try {
    if (options.conf === CLIConfig.CMS) {
      await CMSBuilder.build(options);
    } else {
      await CMSFrontBuilder.build(options);
    }
  } catch (error) {
    console.error(error);
    return;
  }
}
