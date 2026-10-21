import type { Permission } from '@/types';
import { hasPermission, useAuthStore } from '@/store/auth';

/** 组件内权限判断：按钮级权限控制统一走这里，避免各处散落判断逻辑 */
export function usePermission() {
  const session = useAuthStore((state) => state.session);

  return {
    session,
    can: (permission: Permission) => hasPermission(session, permission),
    cannot: (permission: Permission) => !hasPermission(session, permission),
  };
}
