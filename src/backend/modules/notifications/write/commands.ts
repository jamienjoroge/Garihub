import { EventMetadata } from '../../../contracts/common';

export interface RequestNotificationCommand {
  command_name: 'RequestNotification';
  metadata: EventMetadata;
  payload: {
    notificationId: string;
    userId: string;
    channel: 'email' | 'sms';
    template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
    targetRef: string;
    payload: Record<string, unknown>;
  };
}

export interface GrantNotificationProofAccessCommand {
  command_name: 'GrantNotificationProofAccess';
  metadata: EventMetadata;
  payload: {
    notificationId: string;
    tokenId: string;
    expiresAt: string;
    issuedBy: string;
    reason: string;
  };
}