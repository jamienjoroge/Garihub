import { EventMetadata } from '../../../contracts/common';

export type InventoryEventName =
  | 'StockReceived'
  | 'StockIssued'
  | 'StockTransferred'
  | 'StockAdjusted'
  | 'StockReordered'
  | 'StockDisposed'
  | 'PurchaseOrderCreated'
  | 'PurchaseOrderApproved'
  | 'PurchaseOrderSent'
  | 'PurchaseOrderModified'
  | 'PurchaseOrderCancelled';

export interface InventoryEvent<TPayload = Record<string, unknown>> {
  event_name: InventoryEventName;
  metadata: EventMetadata;
  payload: TPayload;
}