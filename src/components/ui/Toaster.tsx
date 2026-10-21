import { Icon, type IconName } from '@/components/Icon';
import { useUiStore, type ToastTone } from '@/store/ui';

const toneIcon: Record<ToastTone, IconName> = {
  success: 'check',
  warning: 'alert',
  danger: 'alert',
  info: 'info',
};

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <span className="toast-icon">
            <Icon name={toneIcon[toast.tone]} size={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="toast-title">{toast.title}</div>
            {toast.description && <div className="toast-desc">{toast.description}</div>}
          </div>
          <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="关闭提示">
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
