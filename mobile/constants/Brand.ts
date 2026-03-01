/**
 * Aurralis Montessori — Brand Constants
 * Colors extracted from the official logo:
 *   - Deep purple / indigo: primary brand color (shield emblem, logo text)
 *   - Teal:                 accent (already used throughout)
 *   - Blue:                 secondary actions
 *   - Soft lavender:        backgrounds and cards
 */

export const BRAND = {
    // ── Core brand colours ────────────────────────────────────────────────
    purple: '#5B3FA0',   // Deep purple — primary (logo shield)
    purpleLight: '#7C5FC4',   // Lighter purple — hover / active states
    purpleBg: '#F3EFFC',   // Very light lavender — card backgrounds
    teal: '#20C9BA',   // Teal — accent (matches logo wave turquoise)
    tealLight: '#E8FAF8',   // Pale teal — chip / badge backgrounds
    blue: '#4A90D9',   // Blue — secondary (logo dot scatter)
    blueBg: '#EEF6FF',   // Pale blue — info backgrounds

    // ── Neutral / base ────────────────────────────────────────────────────
    bg: '#F7F5FB',   // Soft lavender-white — app background
    white: '#FFFFFF',
    ink: '#1A1035',   // Near-black with purple tint — primary text
    label: '#6B6080',   // Muted purple-grey — secondary text
    border: '#E8E4F0',   // Lavender border
    muted: '#B8AED0',   // Placeholder / disabled
};

/** Shared shadow for cards */
export const SHADOW = {
    shadowColor: BRAND.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
};

/** Tab bar active tint colour */
export const TAB_ACTIVE = BRAND.purple;
export const TAB_INACTIVE = BRAND.muted;
