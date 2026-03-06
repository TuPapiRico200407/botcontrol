import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import tsEslint from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/.wrangler/**", "**/build/**"]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            parser: parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                console: 'readonly',
                document: 'readonly',
                window: 'readonly',
                fetch: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsEslint.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn'
        }
    }
];

