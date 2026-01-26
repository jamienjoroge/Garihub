import { EventLedger } from '../../../core/event-ledger/Ledger';
import { RequestOtpCommand, VerifyOtpCommand } from './commands';
import { signToken } from '../token';
import { randomUUID } from 'crypto';

export class AuthService {
  constructor(private ledger: EventLedger) {}

  async requestOtp(cmd: RequestOtpCommand) {
    const otpId = randomUUID();
    await this.ledger.append('AuthOtpRequested', cmd.metadata, {
      phone: cmd.payload.phone,
      tenant_id: cmd.payload.tenant_id,
      otpId,
      requestedAt: cmd.metadata.timestamp,
    });
    return { otpId };
  }

  async verifyOtp(cmd: VerifyOtpCommand) {
    const valid = cmd.payload.code === '123456';
    if (!valid) throw new Error('INVALID_OTP');
    const role: 'CUSTOMER' | 'MANAGER' = 'CUSTOMER';
    const userId = cmd.payload.phone;
    await this.ledger.append('AuthOtpVerified', cmd.metadata, {
      phone: cmd.payload.phone,
      tenant_id: cmd.payload.tenant_id,
      userId,
      role,
      verifiedAt: cmd.metadata.timestamp,
    });
    const token = signToken({ tenant_id: cmd.payload.tenant_id, userId, role, iat: Date.now() });
    return { token, user: { userId, role } };
  }
}