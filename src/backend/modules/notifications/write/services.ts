import { EventLedger } from '../../../core/event-ledger/Ledger';
import { RequestNotificationCommand } from './commands';
import { AuthorizationError, ValidationError } from '../../../core/errors/domain';

export class NotificationService {
  constructor(private ledger: EventLedger) {}

  private async isOptIn(tenant_id: string, userId: string, channel: 'email' | 'sms'): Promise<boolean> {
    const events = await this.ledger.replay(tenant_id);
    const prefsUpdated = events.filter(e => e.event_name === 'CustomerCommunicationPreferencesUpdated' && String((e.payload as any).userId) === userId);
    if (prefsUpdated.length) {
      const last = prefsUpdated[prefsUpdated.length - 1] as any;
      const cp = last.payload as any;
      if (channel === 'email') return !!cp?.emailOptIn;
      if (channel === 'sms') return !!cp?.smsOptIn;
    }
    const prefs = events.filter(e => e.event_name === 'CustomerUpdated' && e.payload?.communicationPreferences && e.payload?.id === userId);
    if (!prefs.length) return false;
    const last = prefs[prefs.length - 1] as any;
    const cp = last.payload.communicationPreferences as any;
    if (channel === 'email') return !!cp?.emailOptIn;
    if (channel === 'sms') return !!cp?.smsOptIn;
    return false;
  }

  async request(cmd: RequestNotificationCommand) {
    const metadata = cmd.metadata;
    const tenant = metadata.tenant_id;
    const duplicate = (await this.ledger.replay(tenant)).find(e => e.event_name === 'NotificationRequested' && e.payload?.correlation_id === metadata.correlation_id);
    if (duplicate) return duplicate;
    const ok = await this.isOptIn(tenant, cmd.payload.userId, cmd.payload.channel);
    if (!ok) throw new AuthorizationError('Notification channel not opted-in');
    if (!cmd.payload.notificationId || !cmd.payload.userId || !cmd.payload.targetRef) throw new ValidationError('Missing fields');
    const evt = await this.ledger.append('NotificationRequested', metadata, {
      notificationId: cmd.payload.notificationId,
      tenant_id: tenant,
      userId: cmd.payload.userId,
      channel: cmd.payload.channel,
      template: cmd.payload.template,
      targetRef: cmd.payload.targetRef,
      payload: cmd.payload.payload,
      requestedAt: metadata.timestamp,
      correlation_id: metadata.correlation_id,
    });
    return evt;
  }
}