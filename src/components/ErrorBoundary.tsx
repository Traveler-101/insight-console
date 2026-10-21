import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 路由级错误边界：单个页面渲染异常不至于整站白屏。
 * 类组件是 React 目前唯一支持 componentDidCatch 的写法。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 生产环境这里上报 Sentry / 埋点
    console.error('[Insight] 页面渲染异常', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>🛠</div>
        <h2 style={{ fontSize: 17, fontWeight: 650 }}>这个模块出了点问题</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 6 }}>
          已捕获异常，其他页面不受影响。{this.state.message}
        </p>
        <button
          className="btn btn--primary btn--sm"
          style={{ marginTop: 16 }}
          onClick={() => this.setState({ hasError: false, message: '' })}
        >
          重试渲染
        </button>
      </div>
    );
  }
}
