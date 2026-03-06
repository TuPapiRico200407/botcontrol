import type { Config } from '@botcontrol/domain';

/**
 * Resolves a config value by key+scope, with org-level override taking
 * priority over global (org_id = null) configs.
 *
 * @param configs - All configs to consider (global + org-specific).
 * @param key - The config key to look up.
 * @param scope - The scope of the config.
 * @param orgId - The org's ID to try for org-level override.
 */
export function resolveConfig(
    configs: Config[],
    key: string,
    scope: string,
    orgId?: string,
): unknown | undefined {
    // 1. Try org-specific value first
    if (orgId) {
        const orgConfig = configs.find(
            (c) => c.org_id === orgId && c.key === key && c.scope === scope,
        );
        if (orgConfig !== undefined) return orgConfig.value_json;
    }

    // 2. Fall back to global (org_id = null)
    const globalConfig = configs.find(
        (c) => c.org_id === null && c.key === key && c.scope === scope,
    );
    return globalConfig?.value_json;
}
