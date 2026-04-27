import axios from 'axios';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { login, requestOtp, API_ORIGIN } from '../../hooks/UseUser';

vi.mock('axios');

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
};

describe('UseUser API helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls login endpoint and returns response payload', async () => {
    const payload = { isSuccessful: true, displayMessage: 'ok', data: { _id: 'u1' } };
    mockedAxios.post = vi.fn().mockResolvedValue({ data: payload });

    const result = await login('ella', 'Password1');

    expect(result).toEqual(payload);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${API_ORIGIN}/user/login`,
      { username: 'ella', password: 'Password1' },
      { withCredentials: true },
    );
  });

  it('returns server-side failure payload from requestOtp errors', async () => {
    const payload = { isSuccessful: false, displayMessage: 'rate limited', data: null };
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { data: payload },
    });

    const result = await requestOtp('ella@example.com');

    expect(result).toEqual(payload);
  });
});
