import { createRoute, z } from '@hono/zod-openapi';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/errors';
import { AuthContext } from '../middleware/auth';

/**
 * GET /api/orgs/:orgId/members
 * List members (SUPER_ADMIN and OWNER only)
 */
export const listMembersRoute = createRoute({
    method: 'get',
    path: '/api/orgs/:orgId/members',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Members list',
            content: {
                'application/json': {
                    schema: z.array(
                        z.object({
                            id: z.string(),
                            userId: z.string(),
                            email: z.string(),
                            role: z.enum(['OWNER', 'AGENT']),
                            active: z.boolean(),
                            invitedAt: z.string(),
                            activatedAt: z.string().nullable(),
                        })
                    ),
                },
            },
        },
    },
});

export const listMembersHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');

    // Check permission: SUPER_ADMIN or OWNER
    if (!auth.isSuperAdmin) {
        if (!auth.orgIds.includes(orgId) || auth.roles[orgId] === 'AGENT') {
            throw new ApiError('Forbidden', 403, 'INSUFFICIENT_ROLE');
        }
    }

    const { data: members, error } = await supabase
        .from('org_members')
        .select('id, user_id, role, active, invited_at, activated_at')
        .eq('org_id', orgId);

    if (error) {
        throw new ApiError('Failed to fetch members', 500, 'DB_ERROR', { error });
    }

    // TODO: Fetch emails from auth.users or a users table
    return c.json(
        members?.map((m) => ({
            id: m.id,
            userId: m.user_id,
            email: `user_${m.user_id.substring(0, 8)}@botcontrol.com`, // Placeholder
            role: m.role,
            active: m.active,
            invitedAt: m.invited_at,
            activatedAt: m.activated_at,
        })) || [],
        200
    );
};

/**
 * POST /api/orgs/:orgId/members
 * Invite new member (SUPER_ADMIN only)
 */
export const inviteMemberRoute = createRoute({
    method: 'post',
    path: '/api/orgs/:orgId/members',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        email: z.string().email(),
                        role: z.enum(['OWNER', 'AGENT']),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Member invited' },
        403: { description: 'Forbidden' },
    },
});

export const inviteMemberHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const { email, role } = await c.req.json();

    if (!auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'SUPER_ADMIN_ONLY');
    }

    if (!['OWNER', 'AGENT'].includes(role)) {
        throw new ApiError('Invalid role', 400, 'INVALID_ROLE');
    }

    // TODO: Get or create user by email (via Supabase Auth API)
    // For now, generate a placeholder UID
    const userId = 'placeholder_' + email.replace(/[^a-z0-9]/g, '_');

    // Check if already member
    const { data: existing } = await supabase
        .from('org_members')
        .select('id, active')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

    if (existing && existing.active) {
        throw new ApiError('Already a member', 409, 'ALREADY_MEMBER');
    }

    // Create or reactivate membership
    if (existing) {
        const { data: member } = await supabase
            .from('org_members')
            .update({ active: true, role })
            .eq('id', existing.id)
            .select()
            .single();

        // Audit
        await supabase.from('audit_logs').insert({
            org_id: orgId,
            actor_user_id: auth.userId,
            action: 'reactivate_member',
            entity_type: 'org_member',
            entity_id: member?.id,
            description: `Reactivated member: ${email}`,
        });

        return c.json(member, 201);
    } else {
        const { data: member } = await supabase
            .from('org_members')
            .insert({
                org_id: orgId,
                user_id: userId,
                role,
                active: true,
                created_by: auth.userId,
            })
            .select()
            .single();

        // Audit
        await supabase.from('audit_logs').insert({
            org_id: orgId,
            actor_user_id: auth.userId,
            action: 'invite_member',
            entity_type: 'org_member',
            entity_id: member?.id,
            description: `Invited ${role}: ${email}`,
        });

        return c.json(member, 201);
    }
};

/**
 * PATCH /api/orgs/:orgId/members/:memberId
 * Update member (change role, revoke access)
 */
export const updateMemberRoute = createRoute({
    method: 'patch',
    path: '/api/orgs/:orgId/members/:memberId',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        role: z.enum(['OWNER', 'AGENT']).optional(),
                        active: z.boolean().optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Updated' },
        403: { description: 'Forbidden' },
    },
});

export const updateMemberHandler = async (c: any) => {
    const auth = c.get('auth') as AuthContext;
    const supabase = c.get('supabase') as SupabaseClient;
    const orgId = c.req.param('orgId');
    const memberId = c.req.param('memberId');
    const updates = await c.req.json();

    if (!auth.isSuperAdmin) {
        throw new ApiError('Forbidden', 403, 'SUPER_ADMIN_ONLY');
    }

    // Get member to check
    const { data: member } = await supabase
        .from('org_members')
        .select('user_id, role, active')
        .eq('id', memberId)
        .eq('org_id', orgId)
        .single();

    if (!member) {
        throw new ApiError('Not found', 404, 'MEMBER_NOT_FOUND');
    }

    // Prevent changing own role
    if (member.user_id === auth.userId && updates.role && updates.role !== member.role) {
        throw new ApiError('Cannot change own role', 409, 'CANNOT_CHANGE_OWN_ROLE');
    }

    const { data: updated } = await supabase
        .from('org_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

    // Audit
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        actor_user_id: auth.userId,
        action: updates.active === false ? 'revoke_member' : 'update_member_role',
        entity_type: 'org_member',
        entity_id: memberId,
        old_value: member,
        new_value: updated,
        description: `Updated member: ${updates.role || 'revoked'}`,
    });

    return c.json(updated, 200);
};
