import { EventMetadata } from '../../../contracts/common';

export type AIEventName =
  | 'AiDiagnosisRequested'
  | 'AiDiagnosisCompleted'
  | 'AiCostEstimateGenerated'
  | 'AiDiagnosisRejected'
  | 'AiMarketingCampaignGenerated'
  | 'AiCustomerReportGenerated'
  | 'AiResponseAnalyzed';

export interface AIEvent<TPayload = Record<string, unknown>> {
  event_name: AIEventName;
  metadata: EventMetadata;
  payload: TPayload;
}