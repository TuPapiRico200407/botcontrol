/**
 * Design System Tokens — Dark Theme
 * Global color, spacing, and typography tokens for consistent UI
 */

export const colors = {
    // Neutral grays (dark theme)
    neutral: {
        50:  '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712',
    },
    
    // Semantic: backgrounds (dark theme)
    background: {
        primary:   '#111827',  // Main bg (almost black)
        secondary: '#1f2937',  // Card/elevated
        tertiary:  '#374151',  // Hover states
        muted:     '#4b5563',  // Disabled
    },
    
    // Semantic: text
    text: {
        primary:   '#f3f4f6',  // Main text (almost white)
        secondary: '#d1d5db',  // Secondary text
        tertiary:  '#9ca3af',  // Muted text
        inverse:   '#111827',  // For light backgrounds
    },
    
    // Accents
    accent: {
        primary:   '#60a5fa',   // Blue (primary actions)
        hover:     '#3b82f6',   // Darker blue (hover)
        focus:     '#1d4ed8',   // Darkest blue (focus)
        light:     '#93c5fd',   // Light blue (backgrounds)
    },
    
    // Status colors
    status: {
        success: '#10b981',
        warning: '#f59e0b',
        error:   '#ef4444',
        info:    '#3b82f6',
    },
    
    // Status backgrounds (light versions)
    statusBg: {
        success: '#064e3b',
        warning: '#78350f',
        error:   '#7f1d1d',
        info:    '#1e3a8a',
    },
};

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
};

export const typography = {
    family:    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono:      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Courier, monospace',
    
    sizes: {
        xs:  '0.75rem',    // 12px
        sm:  '0.875rem',   // 14px
        base: '1rem',      // 16px
        lg:  '1.125rem',   // 18px
        xl:  '1.25rem',    // 20px
    },
    
    weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
};

export const border = {
    radius: {
        sm:  '0.375rem',   // 6px
        md:  '0.5rem',     // 8px
        lg:  '0.75rem',    // 12px
        xl:  '1rem',       // 16px
        full: '9999px',
    },
    
    width: {
        DEFAULT: '1px',
        light:   '0.5px',
        thick:   '2px',
    },
    
    color: '#374151',  // primary border color (dark)
};

export const shadow = {
    sm:     '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md:     '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg:     '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl:     '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl':  '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overlay: '0 0px 0px 9999px rgba(0, 0, 0, 0.5)', // For modals
};

export const transition = {
    fast:   '150ms ease-out',
    base:   '200ms ease-out',
    slow:   '300ms ease-out',
};

export default {
    colors,
    spacing,
    typography,
    border,
    shadow,
    transition,
};
