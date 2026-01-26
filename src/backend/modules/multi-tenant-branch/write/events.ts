import { EventMetadata } from '../../../contracts/common';

export type MultiTenantEventName =
  | 'BranchCreated'
  | 'BranchConfigurationUpdated'
  | 'UserBranchAccessGranted'
  | 'UserBranchAccessRevoked'
  | 'InterBranchTransferInitiated'
  | 'InterBranchTransferApproved'
  | 'InterBranchTransferShipped'
  | 'InterBranchTransferReceived'
  | 'InterBranchServiceRequested'
  | 'InterBranchServiceCompleted'
  | 'ConsolidatedFinancialReportGenerated'
  | 'BranchPerformanceCalculated'
  | 'CrossBranchCustomerActivity';

export interface MultiTenantEvent<TPayload = Record<string, unknown>> {
  event_name: MultiTenantEventName;
  metadata: EventMetadata;
  payload: TPayload;
}