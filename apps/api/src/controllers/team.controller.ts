import type { Request, Response } from 'express';
import type { InviteMemberInput, UpdateMemberInput } from '@cc/shared';
import { teamService } from '../services/team.service';
import { ApiError } from '../utils/errors';
import { created, noContent, success } from '../utils/response';

export const teamController = {
  async list(req: Request, res: Response): Promise<void> {
    success(res, await teamService.list(req.params.storeId!));
  },

  async invite(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    const member = await teamService.invite(
      req.params.storeId!,
      req.auth.userId,
      req.body as InviteMemberInput,
    );
    created(res, member, 'Invitation sent');
  },

  async update(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    const member = await teamService.update(
      req.params.storeId!,
      req.auth.userId,
      req.params.memberId!,
      req.body as UpdateMemberInput,
    );
    success(res, member, 'Team member updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    await teamService.remove(req.params.storeId!, req.auth.userId, req.params.memberId!);
    noContent(res);
  },
};
