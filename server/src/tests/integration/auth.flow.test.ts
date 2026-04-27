import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import '../setup/mongodb';

describe('auth flow integration', () => {
  it('signs up, logs in, and accesses a protected endpoint', async () => {
    const { app } = createApp('http://localhost:5173');
    const agent = request.agent(app);

    const signUpResponse = await agent.post('/user/signUp').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'Password1',
      phone: '123456789',
    });

    expect(signUpResponse.status).toBe(200);
    expect(signUpResponse.body?.data?.username).toBe('alice');
    expect(signUpResponse.body?.data?.password).toBe('*****');

    const loginResponse = await agent.post('/user/login').send({
      username: 'alice',
      password: 'Password1',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const profileResponse = await agent.get('/user/getUserDetails');
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body?.data?.email).toBe('alice@example.com');
    expect(profileResponse.body?.data?.password).toBeUndefined();
  });
});
