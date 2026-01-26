import { EventMetadata } from '../../../contracts/common';

export type CustomerVehicleEventName =
  | 'CustomerRegistered'
  | 'CustomerUpdated'
  | 'VehicleRegistered'
  | 'CustomerSegmented'
  | 'CustomerCommunicationLogged'
  | 'AppointmentBooked'
  | 'AppointmentRescheduled'
  | 'AppointmentCancelled'
  | 'CustomerFeedbackReceived'
  | 'WarrantyClaimInitiated'
  | 'ServiceRecordMinted'
  | 'InspectionRecorded'
  | 'VehicleHistoryAccessGranted'
  | 'CustomerCommunicationPreferencesUpdated';

export interface CustomerVehicleEvent<TPayload = Record<string, unknown>> {
  event_name: CustomerVehicleEventName;
  metadata: EventMetadata;
  payload: TPayload;
}