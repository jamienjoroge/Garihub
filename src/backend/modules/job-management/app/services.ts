import { EventLedger } from '../../../core/event-ledger/Ledger';
import { EventMetadata } from '../../../contracts/common';
import { JobStatus } from '../../../../types';
import {
  CreateJobCardCommand,
  CompleteJobCommand,
  StartJobCommand,
  PauseJobCommand,
  ResumeJobCommand,
  ChangeJobStatusCommand,
  AddPartToJobCommand,
  RecordLaborTimeCommand,
} from '../write/commands';

export interface AuthzPolicy {
  canCreateJob(user_id: string, branch_id: string): Promise<boolean>;
  canChangeStatus(user_id: string, branch_id: string, to: JobStatus): Promise<boolean>;
  canCompleteJob(user_id: string, branch_id: string): Promise<boolean>;
}

export interface CustomerGateway {
  exists(customerId: string): Promise<boolean>;
}

export interface VehicleGateway {
  exists(vehicleId: string): Promise<boolean>;
}

export interface ReadModelGateway {
  partsForJob(tenant_id: string, job_id: string): Promise<{ productId: string; quantity: number }[]>;
  laborForJob(tenant_id: string, job_id: string): Promise<{ minutes: number }[]>;
}

export class JobService {
  constructor(
    private ledger: EventLedger,
    private authz: AuthzPolicy,
    private customers: CustomerGateway,
    private vehicles: VehicleGateway,
    private reads: ReadModelGateway
  ) {}

  async createJobCard(cmd: CreateJobCardCommand) {
    const { metadata } = cmd;
    const allowed = await this.authz.canCreateJob(metadata.user_id, metadata.branch_id);
    if (!allowed) throw new Error('UNAUTHORIZED');
    const customerOk = await this.customers.exists(cmd.payload.job.vehicle.ownerName);
    const vehicleOk = await this.vehicles.exists(cmd.payload.job.vehicle.id);
    if (!customerOk || !vehicleOk) throw new Error('INVALID_CUSTOMER_OR_VEHICLE');
    return this.ledger.append('JobCardCreated', metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job.id,
      job: cmd.payload.job,
    });
  }

  async startJob(cmd: StartJobCommand) {
    const ok = await this.authz.canChangeStatus(cmd.metadata.user_id, cmd.metadata.branch_id, JobStatus.IN_PROGRESS);
    if (!ok) throw new Error('UNAUTHORIZED');
    return this.ledger.append('JobStarted', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      at: cmd.payload.startTime,
    });
  }

  async pauseJob(cmd: PauseJobCommand) {
    const ok = await this.authz.canChangeStatus(cmd.metadata.user_id, cmd.metadata.branch_id, JobStatus.WAITING_PARTS);
    if (!ok) throw new Error('UNAUTHORIZED');
    return this.ledger.append('JobPaused', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      reason: cmd.payload.reason,
      at: cmd.payload.time,
    });
  }

  async resumeJob(cmd: ResumeJobCommand) {
    const ok = await this.authz.canChangeStatus(cmd.metadata.user_id, cmd.metadata.branch_id, JobStatus.IN_PROGRESS);
    if (!ok) throw new Error('UNAUTHORIZED');
    return this.ledger.append('JobResumed', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      at: cmd.payload.time,
    });
  }

  async recordPart(cmd: AddPartToJobCommand) {
    return this.ledger.append('PartAddedToJob', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      productId: cmd.payload.productId,
      quantity: cmd.payload.quantity,
    });
  }

  async recordLabor(cmd: RecordLaborTimeCommand) {
    return this.ledger.append('LaborTimeRecorded', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      technicianId: cmd.payload.technicianId,
      startTime: cmd.payload.startTime,
      endTime: cmd.payload.endTime,
      durationMinutes: cmd.payload.durationMinutes,
      hourlyRate: cmd.payload.hourlyRate,
      cost: cmd.payload.cost,
    });
  }

  async changeStatus(cmd: ChangeJobStatusCommand) {
    const ok = await this.authz.canChangeStatus(cmd.metadata.user_id, cmd.metadata.branch_id, cmd.payload.to);
    if (!ok) throw new Error('UNAUTHORIZED');
    return this.ledger.append('JobStatusChanged', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      from: cmd.payload.from,
      to: cmd.payload.to,
      reason: cmd.payload.reason,
    });
  }

  async completeJob(cmd: CompleteJobCommand) {
    const allowed = await this.authz.canCompleteJob(cmd.metadata.user_id, cmd.metadata.branch_id);
    if (!allowed) throw new Error('UNAUTHORIZED');
    const parts = await this.reads.partsForJob(cmd.metadata.tenant_id, cmd.payload.job_id);
    const labor = await this.reads.laborForJob(cmd.metadata.tenant_id, cmd.payload.job_id);
    if (!parts.length) throw new Error('NO_PARTS_RECORDED');
    if (!labor.length) throw new Error('NO_LABOR_RECORDED');
    const evt = await this.ledger.append('JobCompleted', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.job_id,
      notes: cmd.payload.completionNotes,
    });
    return evt;
  }
}