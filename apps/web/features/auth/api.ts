import type { AuthSessionDto, UserDto, StoreSummaryDto } from '@cc/types';
import type { LoginInput, RegisterInput } from '@cc/shared';
import { api } from '@/services/http';

export type MeResponse = UserDto & { stores: StoreSummaryDto[] };

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<AuthSessionDto>('/auth/register', input, { anonymous: true }),
  login: (input: LoginInput) => api.post<AuthSessionDto>('/auth/login', input, { anonymous: true }),
  refresh: () => api.post<AuthSessionDto>('/auth/refresh', {}, { anonymous: true }),
  logout: () => api.post<void>('/auth/logout', {}, { anonymous: true }),
  me: () => api.get<MeResponse>('/me'),
  forgotPassword: (email: string) =>
    api.post<{ sent: boolean }>('/auth/forgot-password', { email }, { anonymous: true }),
  resetPassword: (token: string, password: string) =>
    api.post<{ reset: boolean }>('/auth/reset-password', { token, password }, { anonymous: true }),
};
