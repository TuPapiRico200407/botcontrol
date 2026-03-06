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
