import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Permission, Session } from '@/types';
import { login as loginApi, type LoginPayload } from '@/api/auth';
import { ApiError } from '@/api/client';

interface AuthState {
  session: Session | null;
  status: 'idle' | 'authenticating' | 'authenticated';
  error: string | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      status: 'idle',
      error: null,
      async login(payload) {
        set({ status: 'authenticating', error: null });
        try {
          const session = await loginApi(payload);
          set({ session, status: 'authenticated' });
          return true;
        } catch (error) {
          const message = error instanceof ApiError ? error.message : '登录失败，请重试';
          set({ status: 'idle', error: message });
          return false;
        }
      },
      logout() {
        set({ session: null, status: 'idle', error: null });
      },
      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'insight.auth',
      // 只持久化会话，loading / error 属于运行时状态
      partialize: (state) => ({ session: state.session, status: state.status }),
    },
  ),
);

/** 权限判断放在 store 外部，方便在非组件环境（如路由守卫）复用 */
export const hasPermission = (session: Session | null, permission: Permission) =>
  Boolean(session?.permissions.includes(permission));
