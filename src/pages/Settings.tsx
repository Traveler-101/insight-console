import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { resetOrderStore } from '@/api/orders';
import { resetUserStore } from '@/api/users';
import { ROLE_LABEL } from '@/api/mockData';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const STACK = [
  'React 18 · 并发渲染 / StrictMode 双调用校验',
  'TypeScript strict · 领域模型集中在 types',
  'React Router 6 · 嵌套路由 + 路由守卫',
  'TanStack Query 5 · 服务端状态与缓存',
  'Zustand 4 · 轻量客户端状态 + persist',
  'Vite 5 · 手动分包 / 路径别名',
  'Vitest + Testing Library · 单元与组件测试',
];

export function SettingsPage() {
  const theme = useUiStore((state) => state.theme);
  const density = useUiStore((state) => state.density);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const setDensity = useUiStore((state) => state.setDensity);
  const pushToast = useUiStore((state) => state.pushToast);
  const autoRefresh = useUiStore((state) => state.autoRefresh);
  const toggleAutoRefresh = useUiStore((state) => state.toggleAutoRefresh);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const resetDemoData = () => {
    resetOrderStore();
    resetUserStore();
    queryClient.invalidateQueries();
    pushToast({
      title: '演示数据已重置',
      description: '订单状态与成员角色恢复为初始值',
      tone: 'success',
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Workspace</div>
          <h1 className="page-title">工作台设置</h1>
          <p className="page-desc">主题、信息密度、演示数据与项目说明</p>
        </div>
      </div>

      <div className="section-grid grid-main-side">
        <div className="stack-16">
          <Card title="外观" sub="设置会持久化到 localStorage，刷新后保持">
            <div className="settings-row">
              <div>
                <div className="settings-label">主题模式</div>
                <div className="settings-desc">浅色适合白天办公，深色适合夜间盯盘。</div>
              </div>
              <Segmented
                ariaLabel="主题"
                value={theme}
                onChange={(next) => {
                  if (next !== theme) toggleTheme();
                }}
                options={[
                  { value: 'light', label: '浅色' },
                  { value: 'dark', label: '深色' },
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">信息密度</div>
                <div className="settings-desc">紧凑模式会压缩卡片内边距，适合小屏或需要查看更多数据时。</div>
              </div>
              <Segmented
                ariaLabel="信息密度"
                value={density}
                onChange={setDensity}
                options={[
                  { value: 'comfortable', label: '舒适' },
                  { value: 'compact', label: '紧凑' },
                ]}
              />
            </div>
          </Card>

          <Card title="数据刷新" sub="作用于经营概览页的指标查询">
            <div className="settings-row">
              <div>
                <div className="settings-label">自动刷新</div>
                <div className="settings-desc">
                  开启后概览页每 30 秒重新拉取一次数据（React Query 的 refetchInterval），离开页面自动停止。
                </div>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={autoRefresh}
                aria-label="自动刷新"
                onClick={toggleAutoRefresh}
              />
            </div>
          </Card>

          <Card title="演示数据" sub="所有数据由前端 mock 层生成，可随时重置">
            <div className="settings-row">
              <div>
                <div className="settings-label">恢复初始状态</div>
                <div className="settings-desc">
                  重置 1 万条订单的支付状态与 5 位成员的角色，并清空查询缓存。
                </div>
              </div>
              <Button variant="outline" icon={<Icon name="refresh" size={15} />} onClick={resetDemoData}>
                重置数据
              </Button>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">退出登录</div>
                <div className="settings-desc">清除本地会话后回到登录页，可用于验证不同角色的权限差异。</div>
              </div>
              <Button
                variant="danger"
                icon={<Icon name="logout" size={15} />}
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                退出
              </Button>
            </div>
          </Card>
        </div>

        <div className="stack-16">
          <Card title="当前账号" sub="会话信息">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="avatar" style={{ width: 42, height: 42, fontSize: 15 }}>
                {session?.user.name.slice(0, 1)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 620 }}>{session?.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{session?.user.email}</div>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span>角色</span>
                <Badge tone="accent">{session ? ROLE_LABEL[session.user.role] : '—'}</Badge>
              </div>
              <div className="detail-row">
                <span>部门</span>
                <strong>{session?.user.department}</strong>
              </div>
              <div className="detail-row">
                <span>Token</span>
                <strong className="mono" style={{ maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session?.token}
                </strong>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>已授予权限</div>
              <div className="permission-grid">
                {(session?.permissions ?? []).map((permission) => (
                  <div className="permission-item enabled" key={permission}>
                    <Icon name="check" size={13} />
                    {permission}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="技术栈" sub="这个项目用到了什么">
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 2 }}>
              {STACK.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="info-banner" style={{ marginTop: 14 }}>
              <Icon name="info" size={15} />
              <span>
                运行 <code>npm run dev</code> 启动开发环境，<code>npm test</code> 执行单元测试。
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
