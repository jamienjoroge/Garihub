import { JobStatus, JobCard, LaborLog, DiagnosisItem } from '../../../../types';
import { EventMetadata } from '../../../contracts/common';

export type JobCommandName =
  | 'CreateJobCard'
  | 'UpdateJobCard'
  | 'ChangeJobStatus'
  | 'AssignJob'
  | 'RecordDiagnosis'
  | 'GenerateEstimate'
  | 'ApproveJob'
  | 'StartJob'
  | 'PauseJob'
  | 'ResumeJob'
  | 'CompleteJob'
  | 'CancelJob'
  | 'MintServiceRecord'
  | 'AddPartToJob'
  | 'RemovePartFromJob'
  | 'RecordLaborTime'
  | 'ApplyLaborRate';

export interface BaseJobCommand {
  command_name: JobCommandName;
  metadata: EventMetadata;
}

export interface CreateJobCardCommand extends BaseJobCommand {
  command_name: 'CreateJobCard';
  payload: {
    job: Omit<JobCard, 'id' | 'status' | 'laborLogs' | 'partsUsed' | 'finalCost'>;
  };
}

export interface UpdateJobCardCommand extends BaseJobCommand {
  command_name: 'UpdateJobCard';
  payload: {
    job_id: string;
    changes: Partial<JobCard>;
  };
}

export interface ChangeJobStatusCommand extends BaseJobCommand {
  command_name: 'ChangeJobStatus';
  payload: {
    job_id: string;
    from: JobStatus;
    to: JobStatus;
    reason?: string;
  };
}

export interface AssignJobCommand extends BaseJobCommand {
  command_name: 'AssignJob';
  payload: {
    job_id: string;
    technicianId: string;
    technicianName: string;
  };
}

export interface RecordDiagnosisCommand extends BaseJobCommand {
  command_name: 'RecordDiagnosis';
  payload: {
    job_id: string;
    diagnosis: DiagnosisItem[];
    aiDiagnosis?: string;
  };
}

export interface GenerateEstimateCommand extends BaseJobCommand {
  command_name: 'GenerateEstimate';
  payload: {
    job_id: string;
    parts: { productId: string; name: string; quantity: number; cost: number; sellPrice: number }[];
    labor: LaborLog[];
    validUntil: string;
  };
}

export interface ApproveJobCommand extends BaseJobCommand {
  command_name: 'ApproveJob';
  payload: {
    job_id: string;
    customerConsentRef: string;
  };
}

export interface StartJobCommand extends BaseJobCommand {
  command_name: 'StartJob';
  payload: { job_id: string; startTime: string };
}

export interface PauseJobCommand extends BaseJobCommand {
  command_name: 'PauseJob';
  payload: { job_id: string; reason: string; time: string };
}

export interface ResumeJobCommand extends BaseJobCommand {
  command_name: 'ResumeJob';
  payload: { job_id: string; time: string };
}

export interface CompleteJobCommand extends BaseJobCommand {
  command_name: 'CompleteJob';
  payload: { job_id: string; completionNotes?: string };
}

export interface CancelJobCommand extends BaseJobCommand {
  command_name: 'CancelJob';
  payload: { job_id: string; reason: string };
}

export interface MintServiceRecordCommand extends BaseJobCommand {
  command_name: 'MintServiceRecord';
  payload: {
    job_id: string;
    mileage: number;
    description: string;
    items: string[];
  };
}

export interface AddPartToJobCommand extends BaseJobCommand {
  command_name: 'AddPartToJob';
  payload: { job_id: string; productId: string; quantity: number };
}

export interface RemovePartFromJobCommand extends BaseJobCommand {
  command_name: 'RemovePartFromJob';
  payload: { job_id: string; productId: string; quantity: number; reason: string };
}

export interface RecordLaborTimeCommand extends BaseJobCommand {
  command_name: 'RecordLaborTime';
  payload: LaborLog & { job_id: string };
}

export interface ApplyLaborRateCommand extends BaseJobCommand {
  command_name: 'ApplyLaborRate';
  payload: { job_id: string; technicianId: string; hourlyRate: number };
}

export type JobCommand =
  | CreateJobCardCommand
  | UpdateJobCardCommand
  | ChangeJobStatusCommand
  | AssignJobCommand
  | RecordDiagnosisCommand
  | GenerateEstimateCommand
  | ApproveJobCommand
  | StartJobCommand
  | PauseJobCommand
  | ResumeJobCommand
  | CompleteJobCommand
  | CancelJobCommand
  | MintServiceRecordCommand
  | AddPartToJobCommand
  | RemovePartFromJobCommand
  | RecordLaborTimeCommand
  | ApplyLaborRateCommand;