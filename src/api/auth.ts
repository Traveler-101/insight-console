import type { Permission, Session } from '@/types';
import { ApiError, mockRequest } from './client';
import { MOCK_USERS, ROLE_PERMISSIONS } from './mockData';

const DEMO_PASSWORD = 'insight2026';

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * 演示用登录：账号来自 mock 用户表，统一密码 insight2026。
 * 真实项目里这里换成 POST /api/login，token 由服务端签发。
 */
export async function login({ email, password }: LoginPayload): Promise<Session> {
  return mockRequest(
    () => {
      const user = MOCK_USERS.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || password !== DEMO_PASSWORD) {
        throw new ApiError('账号或密码不正确（演示密码：insight2026）', 401, 'INVALID_CREDENTIALS');
      }
      return {
        token: `mock.${btoa(user.id)}.${Date.now()}`,
        user,
        permissions: ROLE_PERMISSIONS[user.role] as Permission[],
      };
    },
    { delay: 620 },
  );
}

export async function fetchSession(token: string): Promise<Session> {
  return mockRequest(
    () => {
      const id = (() => {
        try {
          return atob(token.split('.')[1] ?? '');
        } catch {
          return '';
        }
      })();
      const user = MOCK_USERS.find((item) => item.id === id);
      if (!user) throw new ApiError('登录状态已失效', 401, 'TOKEN_EXPIRED');
      return {
        token,
        user,
        permissions: ROLE_PERMISSIONS[user.role] as Permission[],
      };
    },
    { delay: 260 },
  );
}

export const demoAccounts = MOCK_USERS.slice(0, 3).map((user) => ({
  email: user.email,
  role: user.role,
  name: user.name,
}));

export { DEMO_PASSWORD };
