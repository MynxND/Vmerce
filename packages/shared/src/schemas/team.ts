import { z } from 'zod';
import { StorePermission, UserRole } from '@cc/types';
import { emailSchema } from './common';

/** Roles that can be assigned to a teammate. Owner is not transferable here. */
export const ASSIGNABLE_ROLES = [UserRole.STORE_ADMIN, UserRole.STAFF] as const;

const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES);

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: assignableRoleSchema,
  /** Additive grants on top of the role matrix. */
  extraPermissions: z.array(z.nativeEnum(StorePermission)).max(20).default([]),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberSchema = z
  .object({
    role: assignableRoleSchema.optional(),
    extraPermissions: z.array(z.nativeEnum(StorePermission)).max(20).optional(),
  })
  .refine((data) => data.role !== undefined || data.extraPermissions !== undefined, {
    message: 'Nothing to update',
  });
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
