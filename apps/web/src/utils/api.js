import { useAuth } from '../contexts/AuthContext';
export class ApiClient {
    baseUrl;
    getAccessToken;
    constructor(baseUrl = 'http://127.0.0.1:8787', getAccessToken) {
        this.baseUrl = baseUrl;
        this.getAccessToken = getAccessToken;
    }
    async request(method, path, body) {
        try {
            const token = await this.getAccessToken();
            const headers = {
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
        }
        catch (err) {
            return {
                error: {
                    code: 'NETWORK_ERROR',
                    message: err instanceof Error ? err.message : 'Network error',
                },
            };
        }
    }
    // Auth
    async login(email) {
        return this.request('POST', '/auth/login', { email });
    }
    async getSession() {
        return this.request('GET', '/auth/session');
    }
    async logout() {
        return this.request('POST', '/auth/logout');
    }
    // Organizations
    async listOrgs() {
        return this.request('GET', '/api/orgs');
    }
    async createOrg(name, slug) {
        return this.request('POST', '/api/orgs', { name, slug });
    }
    async getOrg(orgId) {
        return this.request('GET', `/api/orgs/${orgId}`);
    }
    async updateOrg(orgId, updates) {
        return this.request('PATCH', `/api/orgs/${orgId}`, updates);
    }
    // Members
    async listMembers(orgId) {
        return this.request('GET', `/api/orgs/${orgId}/members`);
    }
    async inviteMember(orgId, email, role = 'AGENT') {
        return this.request('POST', `/api/orgs/${orgId}/members`, { email, role });
    }
    async updateMember(orgId, memberId, updates) {
        return this.request('PATCH', `/api/orgs/${orgId}/members/${memberId}`, updates);
    }
    // Bot
    async getBot(orgId) {
        return this.request('GET', `/api/orgs/${orgId}/bot`);
    }
    async updateBot(orgId, updates) {
        return this.request('PATCH', `/api/orgs/${orgId}/bot`, updates);
    }
    // Audit
    async getAuditLogs(orgId, limit = 50, offset = 0) {
        return this.request('GET', `/api/orgs/${orgId}/audit?limit=${limit}&offset=${offset}`);
    }
}
export function useApi() {
    const { supabase } = useAuth();
    const apiUrl = 'http://127.0.0.1:8787';
    return new ApiClient(apiUrl, async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
    });
}
