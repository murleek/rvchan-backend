export interface ParsedUserAgent {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  raw: string;
}
