import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../config-resolver';
import type { Config } from '@botcontrol/domain';

const baseDate = '2024-01-01T00:00:00Z';

const configs: Config[] = [
    { id: '1', org_id: null, scope: 'bot_settings', key: 'operating_hours', value_json: 'always_open', updated_at: baseDate },
    { id: '2', org_id: 'org-abc', scope: 'bot_settings', key: 'operating_hours', value_json: 'weekdays_only', updated_at: baseDate },
    { id: '3', org_id: null, scope: 'system', key: 'maintenance_mode', value_json: false, updated_at: baseDate },
];

describe('ConfigResolver', () => {
    it('returns org-specific value when both global and org configs exist', () => {
        expect(resolveConfig(configs, 'operating_hours', 'bot_settings', 'org-abc')).toBe('weekdays_only');
    });

    it('falls back to global config when no org-specific config exists', () => {
        expect(resolveConfig(configs, 'operating_hours', 'bot_settings', 'org-xyz')).toBe('always_open');
    });

    it('returns global config when no orgId provided', () => {
        expect(resolveConfig(configs, 'operating_hours', 'bot_settings')).toBe('always_open');
    });

    it('returns undefined when config does not exist', () => {
        expect(resolveConfig(configs, 'nonexistent_key', 'bot_settings')).toBeUndefined();
    });

    it('returns boolean global config correctly', () => {
        expect(resolveConfig(configs, 'maintenance_mode', 'system')).toBe(false);
    });
});
