import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { errorHandler } from './utils/errors';
import { authMiddleware, ContextWithAuth } from './middleware/auth';

// Routes
import { loginHandler, loginRoute, sessionHandler, sessionRoute, logoutHandler, logoutRoute } from './routes/auth';
import { listOrgsHandler, listOrgsRoute, createOrgHandler, createOrgRoute, getOrgHandler, getOrgRoute, updateOrgHandler, updateOrgRoute } from './routes/orgs';
import { listMembersHandler, listMembersRoute, inviteMemberHandler, inviteMemberRoute, updateMemberHandler, updateMemberRoute } from './routes/members';
import { getBotHandler, getBotRoute, updateBotHandler, updateBotRoute } from './routes/bot';
import { auditLogsHandler, auditLogsRoute } from './routes/audit';
import { webhookVerifyRoute, webhookVerifyHandler, webhookReceiveRoute, webhookReceiveHandler } from './routes/webhook';
import { listChannelsRoute, listChannelsHandler, createChannelRoute, createChannelHandler, deleteChannelRoute, deleteChannelHandler } from './routes/whatsapp';
import { listInboxRoute, listInboxHandler, listMessagesRoute, listMessagesHandler, updateConvStateRoute, updateConvStateHandler } from './routes/inbox';
import {
    takeConvRoute, takeConvHandler, releaseConvRoute, releaseConvHandler,
    sendOutboundRoute, sendOutboundHandler,
    addTagRoute, addTagHandler, removeTagRoute, removeTagHandler,
    addNoteRoute, addNoteHandler, listNotesRoute, listNotesHandler,
    listTagsRoute, listTagsHandler
} from './routes/conversations';
import advancedBotLogs from './routes/bot_advanced';
import mediaRouter from './routes/media';
import healthRouter from './routes/health';

type Bindings = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: ContextWithAuth['Variables'] }>();

// CORS
app.use('*', cors({ origin: ['http://localhost:5173', 'http://localhost:8787', 'http://127.0.0.1:5173'] }));

// Supabase client middleware (for all routes)
app.use('*', async (c, next) => {
    const supabase = createClient(
        c.env.SUPABASE_URL || 'http://127.0.0.1:54321',
        c.env.SUPABASE_ANON_KEY || 'dummy_anon',
        { global: { headers: { Authorization: c.req.header('Authorization') || '' } } }
    );
    c.set('supabase', supabase);
    await next();
});

// ===== PUBLIC ROUTES =====

// Health check
app.openapi(
    createRoute({
        method: 'get',
        path: '/health',
        responses: {
            200: {
                description: 'Health check status',
                content: { 'application/json': { schema: z.object({ ok: z.boolean(), version: z.string() }) } },
            },
        },
    }),
    (c) => c.json({ ok: true, version: '1.0.0' }, 200)
);

// OpenAPI documentation
app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { version: '1.0.0', title: 'BotControl API' },
    servers: [{ url: 'http://localhost:8787' }, { url: 'http://127.0.0.1:8787' }],
});
app.get('/swagger', swaggerUI({ url: '/openapi.json' }));

// Webhook (public)
app.openapi(webhookVerifyRoute, webhookVerifyHandler);
app.openapi(webhookReceiveRoute, webhookReceiveHandler);

// Login (public)
app.openapi(loginRoute, loginHandler);

// ===== AUTH-PROTECTED ROUTES =====

// Apply auth middleware to protected routes
app.use('/auth/*', authMiddleware);
app.use('/api/*', authMiddleware);

// Auth endpoints
app.openapi(sessionRoute, sessionHandler);
app.openapi(logoutRoute, logoutHandler);

// Organizations
app.openapi(listOrgsRoute, listOrgsHandler);
app.openapi(createOrgRoute, createOrgHandler);
app.openapi(getOrgRoute, getOrgHandler);
app.openapi(updateOrgRoute, updateOrgHandler);

// Members
app.openapi(listMembersRoute, listMembersHandler);
app.openapi(inviteMemberRoute, inviteMemberHandler);
app.openapi(updateMemberRoute, updateMemberHandler);

// Bot Settings
app.openapi(getBotRoute, getBotHandler);
app.openapi(updateBotRoute, updateBotHandler);

// Audit Logs
app.openapi(auditLogsRoute, auditLogsHandler);

// WhatsApp Channels
app.openapi(listChannelsRoute, listChannelsHandler);
app.openapi(createChannelRoute, createChannelHandler);
app.openapi(deleteChannelRoute, deleteChannelHandler);

// Inbox
app.openapi(listInboxRoute, listInboxHandler);
app.openapi(listMessagesRoute, listMessagesHandler);
app.openapi(updateConvStateRoute, updateConvStateHandler);

// Conversations (Take, Release, Outbound, Tags, Notes)
app.openapi(takeConvRoute, takeConvHandler);
app.openapi(releaseConvRoute, releaseConvHandler);
app.openapi(sendOutboundRoute, sendOutboundHandler);
app.openapi(addTagRoute, addTagHandler);
app.openapi(removeTagRoute, removeTagHandler);
app.openapi(addNoteRoute, addNoteHandler);
app.openapi(listNotesRoute, listNotesHandler);
app.openapi(listTagsRoute, listTagsHandler);

// Sprint 4 Routes (Non-OpenAPI for simplicity)
app.route('/api/orgs/:orgId/bot', advancedBotLogs);
app.route('/api/media', mediaRouter);
app.route('/api/health', healthRouter);

// ===== ERROR HANDLING =====

app.onError(errorHandler);

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404));

// Security scheme registration
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
});

export default app;
