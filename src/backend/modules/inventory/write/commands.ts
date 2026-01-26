import { EventMetadata } from '../../../contracts/common';

export interface IssueStockCommand {
  command_name: 'IssueStock';
  metadata: EventMetadata;
  payload: {
    issueId: string;
    jobId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    branchId: string;
  };
}