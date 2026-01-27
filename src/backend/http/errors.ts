import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError, AuthorizationError, InvalidStateTransitionError, NotFoundError, DomainError } from '../core/errors/domain.ts';
import { InfrastructureError } from '../core/errors/infrastructure.ts';

function statusForError(err: unknown): number {
  if (err instanceof ValidationError) return 422;
  if (err instanceof AuthorizationError) return 403;
  if (err instanceof InvalidStateTransitionError) return 409;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof InfrastructureError) return 500;
  return 500;
}

function codeForError(err: unknown): string {
  if (err instanceof DomainError) return err.code;
  if (err instanceof InfrastructureError) return err.code;
  return 'UNKNOWN_ERROR';
}

function messageForError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function registerErrorMiddleware(app: FastifyInstance) {
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const status = statusForError(error);
    const errorCode = codeForError(error);
    const message = messageForError(error);
    const correlation_id = String((request.headers as any)['x-correlation-id'] || '');
    reply.code(status).send({ errorCode, message, correlation_id });
  });
}