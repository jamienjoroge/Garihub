import { FastifyRequest, FastifyReply } from 'fastify';
import { buildMetadata } from '../metadata';
import { JobService } from '../../modules/job-management/app/services';

export function createJobController(jobService: JobService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'CreateJobCard',
      metadata,
      payload: { job: body.job },
    } as any;
    const evt = await jobService.createJobCard(cmd);
    reply.code(201).send(evt);
  };
}

export function startJobController(jobService: JobService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const params = (req.params || {}) as any;
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'StartJob',
      metadata,
      payload: { job_id: params.id, startTime: body.startTime },
    } as any;
    const evt = await jobService.startJob(cmd);
    reply.code(200).send(evt);
  };
}

export function addPartToJobController(jobService: JobService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const params = (req.params || {}) as any;
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'AddPartToJob',
      metadata,
      payload: { job_id: params.id, productId: body.productId, quantity: body.quantity },
    } as any;
    const evt = await jobService.recordPart(cmd);
    reply.code(201).send(evt);
  };
}

export function recordLaborTimeController(jobService: JobService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const params = (req.params || {}) as any;
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'RecordLaborTime',
      metadata,
      payload: { job_id: params.id, technicianId: body.technicianId, startTime: body.startTime, endTime: body.endTime, durationMinutes: body.durationMinutes, hourlyRate: body.hourlyRate, cost: body.cost },
    } as any;
    const evt = await jobService.recordLabor(cmd);
    reply.code(201).send(evt);
  };
}

export function completeJobController(jobService: JobService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const params = (req.params || {}) as any;
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'CompleteJob',
      metadata,
      payload: { job_id: params.id, completionNotes: body.completionNotes },
    } as any;
    const evt = await jobService.completeJob(cmd);
    reply.code(200).send(evt);
  };
}