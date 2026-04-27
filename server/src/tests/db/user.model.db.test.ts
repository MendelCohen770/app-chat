import bcrypt from 'bcrypt';
import { describe, expect, it } from 'vitest';
import User from '../../models/user.schema';
import '../setup/mongodb';

describe('user model isolated DB tests', () => {
  it('enforces unique email constraint', async () => {
    const hashedPassword = await bcrypt.hash('Password1', 10);

    await User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
      phone: '123456789',
    });

    await expect(
      User.create({
        username: 'alice2',
        email: 'alice@example.com',
        password: hashedPassword,
        phone: '987654321',
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
