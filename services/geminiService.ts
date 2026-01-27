export const diagnoseIssue = async (vehicleModel: string, description: string): Promise<string> => {
  const d = description?.trim() || 'Issue not specified';
  return [
    `• Visual check: fluids, belts, obvious leaks`,
    `• Scan OBD for fault codes`,
    `• Road test to reproduce symptoms`,
    `• Inspect common ${vehicleModel} weak points`,
    `• Check battery/charging, vacuum lines, sensors related to: ${d}`
  ].join('\n');
};

export const generateCustomerReport = async (jobDetails: any): Promise<string> => {
  const v = jobDetails?.vehicle?.plateNumber || jobDetails?.vehicle?.model || 'your vehicle';
  const work = jobDetails?.issueDescription || 'service and inspection';
  const notes = jobDetails?.completionNotes || 'All key systems checked and verified.';
  return `We completed ${work} on ${v}. Parts and labor were applied per standard procedure. ${notes} Drive safely and return if symptoms persist.`;
};

export const generateMarketingMessage = async (campaignType: string, customerName: string = 'Customer'): Promise<string> => {
  const ct = String(campaignType || 'service_reminder').replace(/_/g, ' ');
  return `Hi ${customerName}, ${ct} at GariHub. Book today for fast, reliable service. Call/WhatsApp or visit garihub.co.ke.`;
};

export const estimateRepairCost = async (vehicle: string, issues: string): Promise<{ low: number, high: number, currency: string }> => {
  const text = (issues || '').toLowerCase();
  let low = 5000; let high = 20000;
  if (text.includes('oil') || text.includes('service')) { low = 3000; high = 8000; }
  if (text.includes('brake')) { low = 6000; high = 18000; }
  if (text.includes('suspension') || text.includes('shock')) { low = 12000; high = 35000; }
  if (text.includes('engine')) { low = 25000; high = 120000; }
  return { low, high, currency: 'KES' };
}