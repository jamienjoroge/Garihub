export class InfrastructureError extends Error {
  code: 'INFRASTRUCTURE_ERROR';
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.code = 'INFRASTRUCTURE_ERROR';
    this.name = 'InfrastructureError';
    this.details = details;
  }
}