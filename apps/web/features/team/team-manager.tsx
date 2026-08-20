'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Info, MoreHorizontal, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { ASSIGNABLE_ROLES, permissionsForRole } from '@cc/shared';
import { StorePermission, UserRole, type TeamMemberDto } from '@cc/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { PageHeader } from '@/components/page-header';
import { teamApi, teamKeys } from '@/features/team/api';
import { useActiveStoreId, useHasPermission } from '@/hooks/use-active-store';
import { useSession } from '@/hooks/use-session';
import { ApiClientError, errorMessage } from '@/lib/api-error';
import { formatDate, initials } from '@/lib/utils';

const ROLE_LABEL: Record<string, string> = {
  [UserRole.STORE_OWNER]: 'Owner',
  [UserRole.STORE_ADMIN]: 'Admin',
  [UserRole.STAFF]: 'Staff',
  [UserRole.SUPER_ADMIN]: 'Platform admin',
  [UserRole.CUSTOMER]: 'Customer',
};

const ROLE_HINT: Record<string, string> = {
  [UserRole.STORE_ADMIN]: 'Everything except managing the team.',
  [UserRole.STAFF]: 'Products, orders and customers. No settings or theme.',
};

/** Permissions a staff/admin role does not already grant, offered as extras. */
const GRANTABLE = Object.values(StorePermission);

function permissionLabel(permission: StorePermission): string {
  return permission
    .toLowerCase()
    .split('_')
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function TeamManager() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const canManage = useHasPermission(StorePermission.TEAM_MANAGE);
  const { user } = useSession();

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<(typeof ASSIGNABLE_ROLES)[number]>(UserRole.STAFF);
  const [extras, setExtras] = React.useState<StorePermission[]>([]);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = React.useState<TeamMemberDto | null>(null);

  const listQuery = useQuery({
    queryKey: teamKeys.all(storeId ?? 'none'),
    queryFn: () => teamApi.list(storeId!),
    enabled: Boolean(storeId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: teamKeys.all(storeId!) });
  };

  const invite = useMutation({
    mutationFn: () =>
      teamApi.invite(storeId!, { email: email.trim(), role, extraPermissions: extras }),
    onSuccess: (member) => {
      toast.success(`${member.email} added to your team`);
      setInviteOpen(false);
      setEmail('');
      setExtras([]);
      setInviteError(null);
      invalidate();
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setInviteError(Object.values(error.fieldErrors())[0] ?? error.message);
        return;
      }
      setInviteError(errorMessage(error));
    },
  });

  const changeRole = useMutation({
    mutationFn: (input: { memberId: string; role: (typeof ASSIGNABLE_ROLES)[number] }) =>
      teamApi.update(storeId!, input.memberId, { role: input.role }),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => teamApi.remove(storeId!, memberId),
    onSuccess: () => {
      toast.success('Removed from the team');
      setPendingRemove(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const members = listQuery.data ?? [];
  // Extras only make sense for what the role does not already include.
  const roleBaseline = new Set(permissionsForRole(role));
  const offerable = GRANTABLE.filter((permission) => !roleBaseline.has(permission));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Who can work on this store, and what they are allowed to do."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setInviteError(null);
                setInviteOpen(true);
              }}
            >
              <UserPlus /> Invite teammate
            </Button>
          )
        }
      />

      {!canManage && (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-2.5 p-4 text-sm">
            <Info className="size-4 shrink-0" />
            You can see the team but only an owner can change it.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {listQuery.isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title="Just you so far"
                description="Invite an admin to help run the shop, or staff to handle products and orders."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Extra permissions</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Added</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.userId === user?.id;
                  const editable = canManage && !member.isOwner && !isSelf;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
                            <AvatarFallback>{initials(member.name ?? member.email)}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block max-w-48 truncate font-medium">
                              {member.name ?? member.email}
                              {isSelf && <span className="text-muted-foreground"> (you)</span>}
                            </span>
                            <span className="text-muted-foreground block max-w-48 truncate text-xs">
                              {member.email}
                            </span>
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {editable ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              changeRole.mutate({
                                memberId: member.id,
                                role: value as (typeof ASSIGNABLE_ROLES)[number],
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {ROLE_LABEL[value]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={member.isOwner ? 'default' : 'neutral'}>
                            {member.isOwner && <Crown className="size-3" />}
                            {ROLE_LABEL[member.role] ?? member.role}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {member.extraPermissions.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {member.extraPermissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-[0.625rem]">
                                {permissionLabel(permission)}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {member.acceptedAt ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground hidden whitespace-nowrap xl:table-cell">
                        {formatDate(member.createdAt)}
                      </TableCell>

                      <TableCell>
                        {editable && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${member.email}`}
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {member.effectivePermissions.length} permissions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                destructive
                                onSelect={() => setPendingRemove(member)}
                              >
                                <X /> Remove from store
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" /> How roles work
          </CardTitle>
          <CardDescription>
            Roles map to a permission set that the API checks on every request. The dashboard hides
            what you cannot do, but the server is what enforces it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[UserRole.STORE_OWNER, UserRole.STORE_ADMIN, UserRole.STAFF].map((value) => (
            <div key={value} className="border-border rounded-lg border p-3">
              <p className="text-sm font-medium">{ROLE_LABEL[value]}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {value === UserRole.STORE_OWNER
                  ? 'Full access, including the team and deleting the store.'
                  : ROLE_HINT[value]}
              </p>
              <p className="text-muted-foreground mt-2 text-xs font-medium">
                {permissionsForRole(value).length} permissions
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              If they already have an account they get access immediately. Otherwise they set a
              password through the reset link before they can sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Email" htmlFor="invite-email" required>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@studio.com"
              />
            </Field>

            <Field label="Role" htmlFor="invite-role" hint={ROLE_HINT[role]}>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as (typeof ASSIGNABLE_ROLES)[number]);
                  setExtras([]);
                }}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ROLE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {offerable.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Extra permissions</p>
                <p className="text-muted-foreground text-xs">
                  On top of what {ROLE_LABEL[role]?.toLowerCase()} already includes.
                </p>
                <div className="border-border max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {offerable.map((permission) => (
                    <label
                      key={permission}
                      className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
                    >
                      <Checkbox
                        checked={extras.includes(permission)}
                        onCheckedChange={(checked) =>
                          setExtras((current) =>
                            checked === true
                              ? [...current, permission]
                              : current.filter((entry) => entry !== permission),
                          )
                        }
                      />
                      <span className="text-sm">{permissionLabel(permission)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {inviteError && <p className="text-destructive text-sm font-medium">{inviteError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={invite.isPending}
              disabled={!email.trim()}
              onClick={() => invite.mutate()}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pendingRemove?.name ?? pendingRemove?.email}?</DialogTitle>
            <DialogDescription>
              They lose access to this store immediately. Their user account and anything they
              created stay untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() => pendingRemove && remove.mutate(pendingRemove.id)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
