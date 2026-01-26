export interface JobListItemView {
  id: string;
  vehiclePlate: string;
  status: string;
  branchId: string;
  assignedTechnician?: string;
  estimatedCost?: number;
  finalCost?: number;
}

export interface JobDetailView {
  id: string;
  timeline: { event: string; at: string; by: string; details?: string }[];
}