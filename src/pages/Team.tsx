import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { listUsers, updateUserRole } from '@/api/users';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '@/api/mockData';
import { usePermission } from '@/hooks/usePermission';
import { useUiStore } from '@/store/ui';
import type { Permission, Role, User } from '@/types';

const ROLE_TONE: Record<Role, Tone> = {
  admin: 'accent',
  analyst: 'success',
  viewer: 'neutral',
};

const PERMISSION_META: { key: Permission; label: string; desc: string }[] = [
  { key: 'order:read', label: '查看订单', desc: '读取订单列表与详情' },
  { key: 'order:update', label: '修改订单', desc: '变更订单状态、批量操作' },
  { key: 'order:export', label: '导出数据', desc: '导出 CSV / 报表' },
  { key: 'user:manage', label: '成员管理', desc: '调整成员角色' },
  { key: 'settings:manage', label: '工作台配置', desc: '修改全局设置' },
];

const ROLES: Role[] = ['admin', 'analyst', 'viewer'];

export function TeamPage() {
  const { can, session } = usePermission();
  const pushToast = useUiStore((state) => state.pushToast);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: ({ signal }) => listUsers(signal) });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const snapshot = queryClient.getQueryData<User[]>(['users']);
      queryClient.setQueryData<User[]>(['users'], (previous) =>
        previous?.map((user) => (user.id === id ? { ...user, role } : user)),
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(['users'], context.snapshot);
      pushToast({ title: '角色调整失败', tone: 'danger' });
    },
    onSuccess: (user) => {
      pushToast({
        title: '角色已更新',
        description: `${user.name} → ${ROLE_LABEL[user.role]}`,
        tone: 'success',
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Access Control</div>
          <h1 className="page-title">成员与权限</h1>
          <p className="page-desc">RBAC 角色模型 · 按钮级权限控制 · 只读角色自动降级 UI</p>
        </div>
        <div className="page-actions">
          <Badge tone="accent">
            <Icon name="shield" size={12} />
            当前角色：{session ? ROLE_LABEL[session.user.role] : '—'}
          </Badge>
        </div>
      </div>

      {!can('user:manage') && (
        <div className="info-banner" style={{ marginBottom: 16 }}>
          <Icon name="lock" size={15} />
          <span>
            你没有「成员管理」权限，角色下拉框已禁用。用 <strong>admin@insight.dev</strong>{' '}
            登录即可体验完整的权限管理。
          </span>
        </div>
      )}

      <div className="section-grid grid-main-side">
        <Card
          title="团队成员"
          sub={`共 ${data?.length ?? 0} 人 · 演示环境支持直接切换角色`}
          actions={<span className="locked-note">角色变更会实时写回列表</span>}
        >
          {isLoading || !data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} height={52} />
              ))}
            </div>
          ) : (
            <div className="member-list">
              {data.map((user) => (
                <div className="member-row" key={user.id}>
                  <div className="avatar">{user.name.slice(0, 1)}</div>
                  <div className="member-main">
                    <div className="member-name">
                      {user.name}
                      {user.id === session?.user.id && <Badge tone="info">我</Badge>}
                    </div>
                    <div className="member-email">{user.email}</div>
                  </div>
                  <div className="member-dept">{user.department}</div>
                  <div className="member-active">{user.lastActive}</div>
                  {can('user:manage') ? (
                    <select
                      className="select role-select"
                      aria-label={`调整 ${user.name} 的角色`}
                      value={user.role}
                      disabled={mutation.isPending || user.id === session?.user.id}
                      title={user.id === session?.user.id ? '不能修改自己的角色' : undefined}
                      onChange={(event) =>
                        mutation.mutate({ id: user.id, role: event.target.value as Role })
                      }
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="stack-16">
          <Card title="角色权限矩阵" sub="checkbox 即功能开关">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ROLES.map((role) => (
                <div key={role}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 7,
                    }}
                  >
                    <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {ROLE_PERMISSIONS[role].length} / {PERMISSION_META.length} 项权限
                    </span>
                  </div>
                  <div className="permission-grid">
                    {PERMISSION_META.map((permission) => {
                      const enabled = ROLE_PERMISSIONS[role].includes(permission.key);
                      return (
                        <div
                          key={permission.key}
                          className={`permission-item ${enabled ? 'enabled' : ''}`}
                          title={permission.desc}
                        >
                          <Icon name={enabled ? 'check' : 'close'} size={13} />
                          {permission.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="权限模型说明" sub="代码里的落地方式">
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.9 }}>
              <li>路由级：未登录访问任意页面会被重定向到登录页，并记录来路。</li>
              <li>组件级：<code className="mono">usePermission().can()</code> 控制按钮的禁用与隐藏。</li>
              <li>数据级：只读角色调用写接口时，服务端仍会二次校验，前端权限只负责体验。</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
