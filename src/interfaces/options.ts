export interface Options {
  help: boolean;
  atlas: boolean;
  name: string;
  port: number;
  templateDir: string;
  ngit: boolean;
  customFront: boolean;
  outputDir?: string;
  conf: string;
  db?: {
    host: string,
    port: string,
    name: string,
    user: string,
    pass: string,
    prfx: string,
    cluster: string,
  }
}
