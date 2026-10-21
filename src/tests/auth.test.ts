import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/store/auth';
import { DEMO_PASSWORD } from '@/api/auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });

  it('密码错误时不写入会话并暴露错误信息', async () => {
    const ok = await useAuthStore.getState().login({ email: 'admin@insight.dev', password: 'wrong' });
    const state = useAuthStore.getState();

    expect(ok).toBe(false);
    expect(state.session).toBeNull();
    expect(state.error).toContain('账号或密码不正确');
  });

  it('管理员登录后带上完整权限列表', async () => {
    const ok = await useAuthStore.getState().login({
      email: 'admin@insight.dev',
      password: DEMO_PASSWORD,
    });
    const { session } = useAuthStore.getState();

    expect(ok).toBe(true);
    expect(session?.user.role).toBe('admin');
    expect(session?.permissions).toEqual(
      expect.arrayContaining(['order:read', 'order:update', 'user:manage']),
    );
  });

  it('只读角色不具备写权限', async () => {
    await useAuthStore.getState().login({ email: 'viewer@insight.dev', password: DEMO_PASSWORD });
    const { session } = useAuthStore.getState();

    expect(session?.permissions).toEqual(['order:read']);
  });
});
