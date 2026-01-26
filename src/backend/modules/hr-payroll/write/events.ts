import { EventMetadata } from '../../../contracts/common';

export type HREventName =
  | 'EmployeeOnboarded'
  | 'EmployeeUpdated'
  | 'EmployeeTerminated'
  | 'EmployeeTransferred'
  | 'LeaveApplied'
  | 'LeaveApproved'
  | 'LeaveCancelled'
  | 'PayrollProcessed'
  | 'PayrollApproved'
  | 'PayrollPaid'
  | 'OvertimeCalculated'
  | 'BonusProcessed'
  | 'DeductionProcessed';

export interface HREvent<TPayload = Record<string, unknown>> {
  event_name: HREventName;
  metadata: EventMetadata;
  payload: TPayload;
}