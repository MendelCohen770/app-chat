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
    expect(sendResponse.body?.data?.conversationId).toBeTruthy();

    const getResponse = await sender.agent.get('/message/getMessages').query({
      conversationId: sendResponse.body?.data?.conversationId,
      limit: '10',
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body?.data?.items).toHaveLength(1);
    expect(getResponse.body?.data?.items?.[0]?.content).toBe('hello from integration test');
    expect(getResponse.body?.data?.hasMore).toBe(false);
  });

  it('marks incoming conversation messages as read via PATCH /message/markRead', async () => {
    const { app } = createApp('http://localhost:5173');
    const sender = await registerAndLogin(app, {
      username: 'sender-read',
      email: 'sender-read@example.com',
      phone: '223456789',
    });
    const receiver = await registerAndLogin(app, {
      username: 'receiver-read',
      email: 'receiver-read@example.com',
      phone: '887654321',
    });

    const sendResponse = await sender.agent.post('/message/sendMessage').send({
      receiver: receiver.userId,
      type: 'text',
      content: 'hello mark-read',
    });
    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body?.data?.readAt).toBeNull();

    const markReadResponse = await receiver.agent.patch('/message/markRead').send({
      peerId: sender.userId,
    });
    expect(markReadResponse.status).toBe(200);
    expect(Array.isArray(markReadResponse.body?.data?.ids)).toBe(true);
    expect(markReadResponse.body?.data?.ids?.length).toBe(1);

    const getResponse = await sender.agent.get('/message/getMessages').query({
      conversationId: sendResponse.body?.data?.conversationId,
      limit: '10',
    });
    expect(getResponse.status).toBe(200);
    expect(getResponse.body?.data?.items?.[0]?.readAt).toBeTruthy();
  });

  it('stores replyTo when sending a reply in the same conversation', async () => {
    const { app } = createApp('http://localhost:5173');
    const sender = await registerAndLogin(app, {
      username: 'sender-reply',
      email: 'sender-reply@example.com',
      phone: '323456789',
    });
    const receiver = await registerAndLogin(app, {
      username: 'receiver-reply',
      email: 'receiver-reply@example.com',
      phone: '787654321',
    });

    const firstMessageResponse = await sender.agent.post('/message/sendMessage').send({
      receiver: receiver.userId,
      type: 'text',
      content: 'first',
    });
    expect(firstMessageResponse.status).toBe(200);

    const replyMessageResponse = await receiver.agent.post('/message/sendMessage').send({
      receiver: sender.userId,
      type: 'text',
      content: 'second (reply)',
      replyTo: firstMessageResponse.body?.data?._id,
    });
    expect(replyMessageResponse.status).toBe(200);
    expect(replyMessageResponse.body?.data?.replyTo).toBe(firstMessageResponse.body?.data?._id);
  });
});
