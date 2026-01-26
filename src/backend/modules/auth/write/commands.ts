import { EventMetadata } from '../../../contracts/common';

export interface RequestOtpCommand {
  command_name: 'RequestOtp';
  metadata: EventMetadata;
  payload: {
    phone: string;
    tenant_id: string;
  };
}

export interface VerifyOtpCommand {
  command_name: 'VerifyOtp';
  metadata: EventMetadata;
  payload: {
    otpId: string;
    phone: string;
    code: string;
    tenant_id: string;
  };
}