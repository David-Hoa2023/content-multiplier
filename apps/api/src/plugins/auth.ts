import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from 'fastify';

export function extractUserId(req: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes) {
  const userId = req.headers['x-user-id'] as string || 'default_user';
  (req as any).userId = userId;
  done();
}
