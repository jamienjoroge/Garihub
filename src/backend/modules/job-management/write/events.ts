import { EventMetadata } from '../../../contracts/common';

export type JobEventName =
  | 'JobCardCreated'
  | 'JobCardUpdated'
  | 'JobStatusChanged'
  | 'JobAssigned'
  | 'JobDiagnosisCompleted'
  | 'JobEstimateGenerated'
  | 'JobApproved'
  | 'JobStarted'
  | 'JobPaused'
  | 'JobResumed'
  | 'JobCompleted'
  | 'JobCancelled'
  | 'ServiceRecordMinted'
  | 'PartAddedToJob'
  | 'PartRemovedFromJob'
  | 'LaborTimeRecorded'
  | 'LaborRateApplied';

export interface JobEvent<TPayload = Record<string, unknown>> {
  event_name: JobEventName;
  metadata: EventMetadata;
  payload: TPayload;
}