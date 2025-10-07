import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '../../server/di/container';
import * as authController from '../../server/controllers/authController';

function makeMockReq(body: any = {}, query: any = {}, user: any = null) {
  return { body, query, user, login: (u: any, cb: any) => cb && cb(null) } as any;
}

function makeMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res._json = null;
  res._redirect = null;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res._json = payload; return res; };
  res.redirect = (path: string) => { res._redirect = path; return res; };
  return res;
}

describe('authController', () => {
  beforeEach(() => {
    register('Storage', () => ({
      getUserByEmail: async (email: string) => undefined,
      createUser: async (u: any) => ({ id: 'u1', email: u.email }),
      createAuthToken: async (t: any) => ({ id: 't1', ...t }),
      getAuthTokenByToken: async (token: string) => ({ id: 't1', email: 'a@b.com', token, used: false, expiresAt: new Date(Date.now() + 10000) }),
      markTokenAsUsed: async (id: string) => {},
      updateUserLastLogin: async (id: string) => {},
      createPasswordResetToken: async (t: any) => ({ id: 'pr1', ...t }),
      getPasswordResetToken: async (token: string) => ({ id: 'pr1', userId: 'u1', token, used: false, expiresAt: new Date(Date.now() + 10000) }),
      markPasswordResetTokenAsUsed: async (id: string) => {},
      updateUserPassword: async (userId: string, hashed: string) => {},
    }));
  });

  it('sendMagicLink should respond with message', async () => {
    const req = makeMockReq({ email: 'a@b.com' });
    const res = makeMockRes();
    await authController.sendMagicLink(req, res);
    expect(res._json).toBeTruthy();
    expect(res._json.message).toMatch(/Magic link sent/i);
  });

  it('verifyMagicLink should redirect to dashboard on success', async () => {
    const req = makeMockReq({}, { token: 'tok' });
    const res = makeMockRes();
    // attach login function on req
    req.login = (user: any, cb: any) => cb(null);
    await authController.verifyMagicLink(req, res);
    expect(res._redirect).toBe('/dashboard');
  });

  it('forgotPassword should respond with message even if user exists', async () => {
    const req = makeMockReq({ email: 'a@b.com' });
    const res = makeMockRes();
    await authController.forgotPassword(req, res);
    expect(res._json).toBeTruthy();
    expect(res._json.message).toMatch(/password reset link/i);
  });

  it('resetPassword should reset and respond success', async () => {
    const req = makeMockReq({ token: 'tok', password: 'NewP@ssw0rd' });
    const res = makeMockRes();
    await authController.resetPassword(req, res);
    expect(res._json).toBeTruthy();
    expect(res._json.message).toMatch(/Password has been reset/i);
  });
});
