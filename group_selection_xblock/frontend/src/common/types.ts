/**
 * Shared TypeScript types for the Group Selection XBlock.
 */

export interface Choice {
  id: string;
  text: string;
}

export interface ContentGroup {
  partition_id: number;
  group_id: number;
  name: string;
}

export interface SelectionData {
  choice_id: string;
  content_group_id: number;
  cohort_id: number | null;
  created: string;
  modified: string;
  can_change: boolean;
}

export interface LearnerConfig {
  block_id: string;
  question_text: string;
  choices: Choice[];
  selection: SelectionData | null;
  allow_change: boolean;
  handler_urls: Record<string, string>;
}

export interface StudioConfig {
  block_id: string;
  course_key: string;
  question_text: string;
  choices: Choice[];
  choice_group_partition_map: Record<string, { group_id: number; partition_id: number }>;
  allow_change: boolean;
  content_groups: ContentGroup[];
  handler_urls: Record<string, string>;
}

export interface HandlerResponse {
  success: boolean;
  error?: string;
  choice_id?: string;
  choice_text?: string;
  content_group_id?: number;
  cohort_id?: number | null;
  can_change?: boolean;
}
