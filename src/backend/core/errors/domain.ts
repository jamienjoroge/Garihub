export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'INVALID_STATE_TRANSITION'
  | 'NOT_FOUND';

export class DomainError extends Error {
  code: DomainErrorCode;
  details?: unknown;
  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.name = 'DomainError';
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('AUTHORIZATION_ERROR', message, details);
    this.name = 'AuthorizationError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('INVALID_STATE_TRANSITION', message, details);
    this.name = 'InvalidStateTransitionError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('NOT_FOUND', message, details);
    this.name = 'NotFoundError';
  }
}