import type { AppFile } from "../files/types.js";

export interface ExecutionItem {
  id: string;
  source: AppFile;
  from: string;
  to: string;
}

export type ExecutionIssueCode =
  | "INVALID_PREVIEW"
  | "NO_CHANGES"
  | "MISSING_SOURCE"
  | "SOURCE_MISMATCH";

export interface ExecutionIssue {
  code: ExecutionIssueCode;
  message: string;
  fileId?: string;
}

export interface ExecutionPlan {
  ready: boolean;
  items: ExecutionItem[];
  issues: ExecutionIssue[];
}

export interface ExecutionSummary {
  requested: number;
  downloaded: number;
}
