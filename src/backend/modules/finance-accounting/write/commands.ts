import { EventMetadata } from '../../../contracts/common';
import { InvoiceItem } from '../../../../types';

export interface GenerateInvoiceCommand {
  command_name: 'GenerateInvoice';
  metadata: EventMetadata;
  payload: {
    invoiceId: string;
    jobId: string;
    customerName: string;
    branchId: string;
    currency: string;
    items: InvoiceItem[];
    netAmount: number;
    dueDate: string;
  };
}

export interface RecordPaymentCommand {
  command_name: 'RecordPayment';
  metadata: EventMetadata;
  payload: {
    paymentId: string;
    invoiceId: string;
    amount: number;
    paymentMethod: 'cash' | 'mpesa' | 'bank';
    reference?: string;
    receivedAt: string;
    branchId: string;
  };
}