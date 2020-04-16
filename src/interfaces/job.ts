export interface Job {
  title: string;
  task: (...args: any) => Promise<void>;
}
