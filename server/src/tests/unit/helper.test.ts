import { describe, expect, it } from 'vitest';
import { genericResponse, generateOTP } from '../../utils/helper';

describe('helper utilities', () => {
  it('creates a predictable generic response shape', () => {
    const payload = genericResponse(true, 'ok', null, null, { id: '123' });

    expect(payload).toEqual({
      isSuccessful: true,
      displayMessage: 'ok',
      description: null,
      exception: null,
      data: { id: '123' },
    });
  });

  it('creates an OTP with numeric digits only', () => {
    const otp = generateOTP(6);

    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });
});
