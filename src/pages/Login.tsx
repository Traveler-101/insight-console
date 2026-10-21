import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import { DEMO_PASSWORD, demoAccounts } from '@/api/auth';
import { ROLE_LABEL } from '@/api/mockData';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

export function LoginPage() {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('admin@insight.dev');
  const [password, setPassword] = useState(DEMO_PASSWORD);

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (session) return <Navigate to={from} replace />;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await login({ email, password });
    if (ok) navigate(from, { replace: true });
  };

  return (
    <div className="login-shell">
      <aside className="login-aside">
        <div className="login-brand">
          <div className="brand-mark">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 19V10M12 19V5M19 19v-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </div>
          Insight Console
        </div>

        <div className="login-hero">
          <h1>
            让每一个经营决策
            <br />
            都有<em>数据回声</em>
          </h1>
          <p>
            面向增长团队的运营数据中台：实时指标、渠道归因、转化漏斗、留存分层与万级订单检索，
            一个工作台完成从监控到洞察的闭环。
          </p>
          <div className="login-metrics">
            <div>
              <div className="login-metric-value">1.2M</div>
              <div className="login-metric-label">日处理埋点事件</div>
            </div>
            <div>
              <div className="login-metric-value">38ms</div>
              <div className="login-metric-label">P95 查询耗时</div>
            </div>
            <div>
              <div className="login-metric-value">99.98%</div>
              <div className="login-metric-label">数据链路可用性</div>
            </div>
          </div>
        </div>

        <div className="login-aside-foot">
          <span>React 18 · TypeScript · Vite</span>
          <span>纯前端演示环境</span>
        </div>
      </aside>

      <main className="login-main">
        <form className="login-form" onSubmit={onSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2>登录工作台</h2>
            <button
              type="button"
              className="icon-btn icon-btn--bordered"
              onClick={toggleTheme}
              aria-label="切换主题"
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
            </button>
          </div>
          <p>使用演示账号进入，不同角色可见的操作权限不同。</p>

          <div className="login-fields">
            <label className="field">
              <span className="field-label">邮箱</span>
              <input
                className="input"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>
            <label className="field">
              <span className="field-label">密码</span>
              <input
                className="input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="演示密码 insight2026"
              />
            </label>

            {error && (
              <div className="login-error" role="alert">
                <Icon name="alert" size={14} />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="login-submit" loading={status === 'authenticating'}>
              进入工作台
            </Button>
          </div>

          <div className="demo-accounts">
            <div className="demo-accounts-title">一键填入演示账号（密码均为 {DEMO_PASSWORD}）</div>
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-account"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                <div className="avatar avatar--sm">{account.name.slice(0, 1)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="demo-account-email">{account.email}</div>
                  <div className="demo-account-role">
                    {account.name} · {ROLE_LABEL[account.role]}
                  </div>
                </div>
                {email === account.email && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        </form>
      </main>
    </div>
  );
}
