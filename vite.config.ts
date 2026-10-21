/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 相对路径，保证静态托管在根目录或子路径下都能正常加载资源
  base: './',
  plugins: [react()],
  resolve: {
    // 与 tsconfig 的 paths 保持一致；'/src' 由 Vite 按项目根目录解析
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        // 手动分包：把体积大且不常变的依赖单独拆出，利于长缓存
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
});
