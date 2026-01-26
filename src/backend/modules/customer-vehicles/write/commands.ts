import { EventMetadata } from '../../../contracts/common';

export interface MintServiceRecordCommand {
  command_name: 'MintServiceRecord';
  metadata: EventMetadata;
  payload: {
    vehicleId: string;
    jobId: string;
    date: string;
    summary: string;
    mileage: number;
  };
}

export interface RecordInspectionCommand {
  command_name: 'RecordInspection';
  metadata: EventMetadata;
  payload: {
    inspectionId: string;
    vehicleId: string;
    inspectorId: string;
    inspectionType: 'routine' | 'pre_purchase';
    findings: string[];
    passed: boolean;
    notes?: string;
    date: string;
  };
}

export interface GrantVehicleHistoryAccessCommand {
  command_name: 'GrantVehicleHistoryAccess';
  metadata: EventMetadata;
  payload: {
    vehicleId: string;
    tokenId: string;
    expiresAt: string;
    issuedBy: string;
    reason: 'owner_view' | 'resale' | 'inspection';
  };
}