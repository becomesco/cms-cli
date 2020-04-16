export interface GatsbyEntryConfig {
  name: string;
  parse: boolean;
  templateId: string;
  entry?: string | string[];
}