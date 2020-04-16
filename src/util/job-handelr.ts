import * as childProcess from 'child_process';
import * as Listr from 'listr';
import { Job } from '../interfaces/job';

export class JobHandler {
  public static async exec(jobs: Job[]) {
    return new Listr(jobs).run();
  }
  public static async process(
    cmd: string,
    outputStream?: (data: string) => void,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const proc = childProcess.exec(cmd);
      if (outputStream) {
        proc.stdout.on('data', (data) => {
          outputStream(data);
        });
      }
      proc.stderr.on('data', (data) => {
        reject(new Error(data));
      });
      proc.on('close', (code) => {
        resolve(code);
      });
    });
  }
}
