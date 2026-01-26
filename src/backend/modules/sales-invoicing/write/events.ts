import { EventMetadata } from '../../../contracts/common';

export type SalesEventName =
  | 'QuotationCreated'
  | 'QuotationRevised'
  | 'QuotationExpired'
  | 'QuotationConvertedToOrder'
  | 'SalesOrderCreated'
  | 'SalesOrderUpdated'
  | 'SalesOrderItemAdded'
  | 'SalesOrderItemRemoved'
  | 'SalesOrderCancelled'
  | 'InvoiceGenerated'
  | 'InvoiceUpdated'
  | 'InvoiceSent'
  | 'PaymentRecorded'
  | 'PaymentAllocated'
  | 'CreditNoteIssued'
  | 'InvoiceWrittenOff';

export interface SalesEvent<TPayload = Record<string, unknown>> {
  event_name: SalesEventName;
  metadata: EventMetadata;
  payload: TPayload;
}