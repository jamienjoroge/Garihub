import { EventMetadata } from '../../../contracts/common';

export type AuthEventName =
  | 'AuthOtpRequested'
  | 'AuthOtpVerified';

export interface AuthOtpRequestedPayload {
  phone: string;
  tenant_id: string;
  otpId: string;
  requestedAt: string;
}

export interface AuthOtpVerifiedPayload {
  phone: string;
  tenant_id: string;
  userId: string;
  role: 'CUSTOMER' | 'MANAGER' | 'TECHNICIAN' | 'RECEPTIONIST' | 'INSPECTOR';
  verifiedAt: string;
}

export interface AuthEvent<TPayload = Record<string, unknown>> {
  event_name: AuthEventName;
  metadata: EventMetadata;
  payload: TPayload;
}