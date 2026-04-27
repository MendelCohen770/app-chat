import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import '../setup/mongodb';

type UserSeed = {
  username: string;
  email: string;
  phone: string;
};

const PASSWORD = 'Password1';

const registerAndLogin = async (app: ReturnType<typeof createApp>['app'], seed: UserSeed) => {
  const agent = request.agent(app);
  const signUpResponse = await agent.post('/user/signUp').send({
    ...seed,
    password: PASSWORD,
  });

  expect(signUpResponse.status).toBe(200);

  const loginResponse = await agent.post('/user/login').send({
    username: seed.username,
    password: PASSWORD,
  });

  expect(loginResponse.status).toBe(200);
  return { agent, userId: signUpResponse.body?.data?._id as string };
};

describe('messages integration', () => {
  it('sends and retrieves messages between two users', async () => {
    const { app } = createApp('http://localhost:5173');
    const sender = await registerAndLogin(app, {
      username: 'sender',
      email: 'sender@example.com',
      phone: '123456789',
    });
    const receiver = await registerAndLogin(app, {
      username: 'receiver',
      email: 'receiver@example.com',
      phone: '987654321',
    });

    const sendResponse = await sender.agent.post('/message/sendMessage').send({
      receiver: receiver.userId,
      type: 'text',
      content: 'hello from integration test',
    });

    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body?.data?.sender).toBe(sender.userId);
    expect(sendResponse.body?.data?.receiver).toBe(receiver.userId);

    const getResponse = await sender.agent.get('/message/getMessages').query({
      sender: sender.userId,
      receiver: receiver.userId,
      limit: '10',
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body?.data?.items).toHaveLength(1);
    expect(getResponse.body?.data?.items?.[0]?.content).toBe('hello from integration test');
    expect(getResponse.body?.data?.hasMore).toBe(false);
  });
});
