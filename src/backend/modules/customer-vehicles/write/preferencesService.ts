import { EventLedger } from '../../../core/event-ledger/Ledger';

export class PreferencesService {
  constructor(private ledger: EventLedger) {}

  async update(tenant_id: string, userId: string, smsOptIn: boolean, emailOptIn: boolean, metadata: any) {
    return this.ledger.append('CustomerCommunicationPreferencesUpdated', metadata, {
      userId,
      smsOptIn,
      emailOptIn,
    });
  }
}