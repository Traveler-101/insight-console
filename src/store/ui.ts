import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
export type ToastTone = 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface UiState {
  theme: Theme;
  density: Density;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  autoRefresh: boolean;
  toasts: Toast[];
  toggleTheme: () => void;
  setDensity: (density: Density) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleAutoRefresh: () => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      density: 'comfortable',
      sidebarCollapsed: false,
      commandOpen: false,
      autoRefresh: false,
      toasts: [],
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setDensity: (density) => set({ density }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
      pushToast: (toast) => {
        toastSeq += 1;
        const id = `toast_${toastSeq}`;
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        // 3.6s 后自动消失；手动关闭时会走 dismissToast，重复调用是幂等的
        window.setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
        }, 3600);
      },
      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
    }),
    {
      name: 'insight.ui',
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        sidebarCollapsed: state.sidebarCollapsed,
        autoRefresh: state.autoRefresh,
      }),
    },
  ),
);
