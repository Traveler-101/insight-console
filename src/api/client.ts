/** 统一的请求层：模拟真实后端的延迟、错误与取消语义 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions {
  /** 模拟网络延迟（毫秒），用于验证 Loading / 竞态处理 */
  delay?: number;
  /** 0 ~ 1，模拟随机失败概率，便于演示错误重试 */
  failureRate?: number;
  signal?: AbortSignal;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('请求已取消', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('请求已取消', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export async function mockRequest<T>(
  factory: () => T,
  { delay = 420, failureRate = 0, signal }: RequestOptions = {},
): Promise<T> {
  // 用抖动让 Loading 骨架更接近真实网络
  await wait(delay + Math.random() * 180, signal);
  if (Math.random() < failureRate) {
    throw new ApiError('网络开小差了，请稍后重试', 503, 'SERVICE_UNAVAILABLE');
  }
  return factory();
}

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';
