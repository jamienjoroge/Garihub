import { EventMetadata } from '../../../contracts/common';

export type FinanceEventName =
  | 'JournalEntryPosted'
  | 'JournalEntryReversed'
  | 'RecurringJournalGenerated'
  | 'YearEndClosingEntries'
  | 'VATCalculated'
  | 'VATReturnFiled'
  | 'PAYECalculated'
  | 'NSSFContributed'
  | 'SHIFContribution'
  | 'HousingLevyDeducted'
  | 'DepreciationCalculated'
  | 'AssetDisposed'
  | 'AssetRevalued';

export interface FinanceEvent<TPayload = Record<string, unknown>> {
  event_name: FinanceEventName;
  metadata: EventMetadata;
  payload: TPayload;
}