export type EventStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'TESTED';

export interface EventMetadata {
  tenant_id: string;
  branch_id: string;
  user_id: string;
  timestamp: string;
  correlation_id: string;
}