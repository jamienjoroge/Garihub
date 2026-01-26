export interface ConsolidatedFinancialReportView {
  period: string;
  branches: string[];
  totals: { revenue: number; expenses: number; profit: number };
}

export interface BranchPerformanceView {
  branchId: string;
  period: string;
  metrics: { revenue: number; profit: number; customerSatisfaction: number };
}