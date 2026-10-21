import type { Role, User } from '@/types';
import { ApiError, mockRequest } from './client';
import { MOCK_USERS } from './mockData';

let store: User[] = [...MOCK_USERS];

export async function listUsers(signal?: AbortSignal): Promise<User[]> {
  return mockRequest(() => [...store], { signal, delay: 340 });
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  return mockRequest(
    () => {
      const index = store.findIndex((user) => user.id === id);
      if (index === -1) throw new ApiError('成员不存在', 404, 'NOT_FOUND');
      const next = { ...store[index], role };
      store = store.map((user, i) => (i === index ? next : user));
      return next;
    },
    { delay: 460 },
  );
}

export function resetUserStore() {
  store = [...MOCK_USERS];
}
