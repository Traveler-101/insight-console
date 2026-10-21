import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 指标类数据 60s 内复用缓存，切页面不重复打接口
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 路由模式随部署环境切换：
 * - 开发环境用 BrowserRouter，保持 /orders 这样的干净 URL；
 * - 生产构建用 HashRouter，因为纯静态托管没有 history fallback，
 *   子路径直接访问或刷新会 404。接入 nginx try_files 或 CDN
 *   SPA 回退规则后，把这里换回 BrowserRouter 即可。
 */
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
