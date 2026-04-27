import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { validateBody } from '../../middlewares/validate.middleware';
import { signUpBodySchema } from '../../schemas/auth.schema';
import { AppError } from '../../middlewares/errorHandler';

describe('validateBody middleware', () => {
  it('accepts valid request bodies and normalizes them', () => {
    const middleware = validateBody(signUpBodySchema);
    const req = {
      body: {
        username: 'alice',
        email: 'ALICE@EXAMPLE.COM',
        password: 'Password1',
        phone: '123456789',
      },
    } as Request;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBeUndefined();
    expect(req.body.email).toBe('alice@example.com');
  });

  it('rejects invalid request bodies with AppError', () => {
    const middleware = validateBody(signUpBodySchema);
    const req = {
      body: {
        username: 'a',
        email: 'bad-email',
        password: 'weak',
        phone: '1',
      },
    } as Request;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, {} as Response, next);

    const calls = (next as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const err = calls[0][0] as AppError;
    expect(next).toHaveBeenCalledTimes(1);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.displayMessage).toBe('Validation error');
  });
});
