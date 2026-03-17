import { useAuth } from '../contexts/AuthContext';

export interface ApiResponse<T> {
    data?: T;
    error?: { code: string; message: string };
}

export class ApiClient {
    constructor(private baseUrl: string = 'http://127.0.0.1:8787', private getAccessToken: () => Promise<string | null>) { }

    private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
        try {
            const token = await this.getAccessToken();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    error: {
                        code: data?.error?.code || 'UNKNOWN_ERROR',
                        message: data?.error?.message || response.statusText || 'Unknown error',
                    },
                };
            }

            const data = await response.json();
            return { data };
        } catch (err) {
            return {
                error: {
                    code: 'NETWORK_ERROR',
                    message: err instanceof Error ? err.message : 'Network error',
                },
            };
        }
    }

    // Auth
    async login(email: string) {
        return this.request<{ message: string }>('POST', '/auth/login', { email });
    }

    async getSession() {
        return this.request<{ user: { id: string; email: string }; orgRoles: Record<string, string[]> }>('GET', '/auth/session');
    }

    async logout() {
        return this.request<{ message: string }>('POST', '/auth/logout');
    }

    // Organizations
    async listOrgs() {
        return this.request<unknown[]>('GET', '/api/orgs');
    }

    async createOrg(name: string, slug: string) {
        return this.request<unknown>('POST', '/api/orgs', { name, slug });
    }

    async getOrg(orgId: string) {
        return this.request<unknown>('GET', `/api/orgs/${orgId}`);
    }

    async updateOrg(orgId: string, updates: Record<string, unknown>) {
        return this.request<unknown>('PATCH', `/api/orgs/${orgId}`, updates);
    }

    // Members
    async listMembers(orgId: string) {
        return this.request<unknown[]>('GET', `/api/orgs/${orgId}/members`);
    }

    async inviteMember(orgId: string, email: string, role: string = 'AGENT') {
        return this.request<unknown>('POST', `/api/orgs/${orgId}/members`, { email, role });
    }

    async updateMember(orgId: string, memberId: string, updates: Record<string, unknown>) {
        return this.request<unknown>('PATCH', `/api/orgs/${orgId}/members/${memberId}`, updates);
    }

    // Bot
    async getBot(orgId: string) {
        return this.request<unknown>('GET', `/api/orgs/${orgId}/bot`);
    }

    async updateBot(orgId: string, updates: Record<string, unknown>) {
        return this.request<unknown>('PATCH', `/api/orgs/${orgId}/bot`, updates);
    }

    // Audit
    async getAuditLogs(orgId: string, limit = 50, offset = 0) {
        return this.request<unknown[]>('GET', `/api/orgs/${orgId}/audit?limit=${limit}&offset=${offset}`);
    }

    // WhatsApp Channels
    async getChannels(orgId: string) {
        return this.request<{ data: unknown[] }>('GET', `/api/orgs/${orgId}/whatsapp/channels`);
    }

    async createChannel(orgId: string, data: unknown) {
        return this.request<{ data: unknown }>('POST', `/api/orgs/${orgId}/whatsapp/channels`, data);
    }

    async deleteChannel(orgId: string, channelId: string) {
        return this.request('DELETE', `/api/orgs/${orgId}/whatsapp/channels/${channelId}`);
    }

    // Inbox
    async getInbox(orgId: string, filters?: { state?: 'BOT' | 'HUMAN' | 'PENDING'; page?: number; limit?: number }) {
        // eslint-disable-next-line no-undef
        const params = new URLSearchParams();
        if (filters?.state) params.append('state', filters.state);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        const qs = params.toString() ? `?${params.toString()}` : '';
        return this.request<{ data: unknown[]; pagination: unknown }>('GET', `/api/orgs/${orgId}/inbox${qs}`);
    }

    async getMessages(orgId: string, convId: string, page = 1, limit = 50) {
        return this.request<{ data: unknown[] }>('GET', `/api/orgs/${orgId}/inbox/${convId}/messages?page=${page}&limit=${limit}`);
    }

    async updateConvState(orgId: string, convId: string, state: 'BOT' | 'HUMAN' | 'PENDING') {
        return this.request('PATCH', `/api/orgs/${orgId}/inbox/${convId}/state`, { state });
    }

    // Conversations / Human Ops (Sprint 3)
    async takeConv(orgId: string, convId: string) {
        return this.request('POST', `/api/orgs/${orgId}/inbox/${convId}/take`);
    }

    async releaseConv(orgId: string, convId: string) {
        return this.request('POST', `/api/orgs/${orgId}/inbox/${convId}/release`);
    }

    async sendOutboundMessage(orgId: string, convId: string, payload: { message_type: string, body?: string, media_url?: string }) {
        return this.request<{ data: unknown }>('POST', `/api/orgs/${orgId}/inbox/${convId}/outbound`, payload);
    }

    async getTags(orgId: string, convId: string) {
        return this.request<{ data: unknown[] }>('GET', `/api/orgs/${orgId}/inbox/${convId}/tags`);
    }

    async addTag(orgId: string, convId: string, tag_name: string) {
        return this.request('POST', `/api/orgs/${orgId}/inbox/${convId}/tags`, { tag_name });
    }

    async removeTag(orgId: string, convId: string, tagName: string) {
        return this.request('DELETE', `/api/orgs/${orgId}/inbox/${convId}/tags/${encodeURIComponent(tagName)}`);
    }

    async getNotes(orgId: string, convId: string) {
        return this.request<{ data: unknown[] }>('GET', `/api/orgs/${orgId}/inbox/${convId}/notes`);
    }

    async addNote(orgId: string, convId: string, content: string) {
        return this.request<{ data: unknown }>('POST', `/api/orgs/${orgId}/inbox/${convId}/notes`, { content });
    }

    // Advanced Bot Configs (Sprint 4)
    async getBotAdvanced(orgId: string) {
        return this.request<{ data: unknown }>('GET', `/api/orgs/${orgId}/bot/advanced`);
    }

    async updateBotAdvanced(orgId: string, botId: string, data: { model?: string, temperature?: number, max_tokens?: number, system_prompt?: string }) {
        return this.request<{ data: unknown }>('PATCH', `/api/orgs/${orgId}/bot/advanced/${botId}`, data);
    }

    async updateConvOverride(orgId: string, convId: string, overrideModel: string | null) {
        return this.request<{ data: unknown }>('PATCH', `/api/orgs/${orgId}/bot/conversations/${convId}/override`, { override_model: overrideModel });
    }

    // Health & Audit (Sprint 4)
    async getHealth(orgId: string) {
        return this.request<{ data: unknown }>('GET', `/api/health/admin?org_id=${orgId}`);
    }
}

export function useApi() {
    const { supabase } = useAuth();
    const apiUrl = 'http://127.0.0.1:8787';
    return new ApiClient(
        apiUrl,
        async () => {
            const { data } = await supabase.auth.getSession();
            return data.session?.access_token || null;
        }
    );
}
