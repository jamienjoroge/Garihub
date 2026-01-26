import { EventMetadata } from '../../../contracts/common';

export type NotificationEventName =
  | 'NotificationRequested'
  | 'NotificationDelivered'
  | 'NotificationDeliveryAttempted'
  | 'NotificationRetryScheduled'
  | 'NotificationCostRecorded'
  | 'TenantNotificationBudgetExceeded'
  | 'DeliveryReceiptReceived'
  | 'NotificationDeliveryReconciled'
  | 'NotificationCorrectiveActionScheduled';

export interface NotificationRequestedPayload {
  notificationId: string;
  tenant_id: string;
  userId: string;
  channel: 'email' | 'sms';
  template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED' | 'SERVICE_RECORD_READY' | 'INVOICE_READY' | 'PAYMENT_RECEIVED';
  targetRef: string;
  payload: Record<string, unknown>;
  requestedAt: string;
  correlation_id: string;
}

export interface NotificationDeliveredPayload {
  notificationId: string;
  channel: 'email' | 'sms';
  providerMessageId: string;
  deliveredAt: string;
  status: 'DELIVERED' | 'FAILED';
  failureReason?: string;
}

export interface NotificationDeliveryAttemptedPayload {
  notificationId: string;
  attemptNumber: number;
  status: 'DELIVERED' | 'FAILED';
  failureReason?: string;
  providerMessageId?: string;
  attemptedAt: string;
}

export interface NotificationRetryScheduledPayload {
  notificationId: string;
  nextAttemptAt: string;
  attemptNumber: number;
}

export interface NotificationCostRecordedPayload {
  notificationId: string;
  attemptNumber: number;
  tenant_id: string;
  channel: 'sms' | 'email';
  unitCost: number;
  currency: string;
  totalCost: number;
  recordedAt: string;
}

export interface TenantNotificationBudgetExceededPayload {
  tenant_id: string;
  period: string;
  budgetLimit: number;
  spendToDate: number;
  exceededAt: string;
}

export interface DeliveryReceiptReceivedPayload {
  notificationId?: string | null;
  providerMessageId: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  receivedAt: string;
  rawStatus?: string;
  rawPayloadHash: string;
  channel: 'sms';
}

export interface NotificationDeliveryReconciledPayload {
  notificationId?: string | null;
  providerMessageId: string;
  attemptNumber?: number | null;
  priorStatus: 'DELIVERED' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  receiptStatus: 'DELIVERED' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  reconciledAt: string;
  action: 'NO_ACTION' | 'MARK_FAILED' | 'SCHEDULE_RETRY';
  reason: string;
}

export interface NotificationCorrectiveActionScheduledPayload {
  notificationId: string;
  actionType: 'RETRY_NOW' | 'RETRY_LATER';
  scheduledAt: string;
}

export interface NotificationProofAccessGrantedPayload {
  notificationId: string;
  tokenId: string;
  expiresAt: string;
  issuedBy: string;
  reason: string;
}

export interface NotificationEvent<TPayload = Record<string, unknown>> {
  event_name: NotificationEventName;
  metadata: EventMetadata;
  payload: TPayload;
}