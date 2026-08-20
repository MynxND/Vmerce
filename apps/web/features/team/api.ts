import type { TeamMemberDto } from '@cc/types';
import type { InviteMemberInput, UpdateMemberInput } from '@cc/shared';
import { api } from '@/services/http';

export const teamApi = {
  list: (storeId: string) => api.get<TeamMemberDto[]>(`/stores/${storeId}/team`),

  invite: (storeId: string, input: InviteMemberInput) =>
    api.post<TeamMemberDto>(`/stores/${storeId}/team`, input),

  update: (storeId: string, memberId: string, input: UpdateMemberInput) =>
    api.patch<TeamMemberDto>(`/stores/${storeId}/team/${memberId}`, input),

  remove: (storeId: string, memberId: string) =>
    api.delete<void>(`/stores/${storeId}/team/${memberId}`),
};

export const teamKeys = {
  all: (storeId: string) => ['stores', storeId, 'team'] as const,
};
