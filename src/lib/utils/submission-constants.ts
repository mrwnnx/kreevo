/**
 * Pure constants for the submission flow.
 *
 * Lives in its own module (no side effects, no SDK imports) so that
 * client components can import them without dragging the Anthropic SDK
 * — and its top-level `new Anthropic()` constructor — into the browser
 * bundle.
 */

export const HUMAN_REVIEW_THRESHOLD = 3        // ai_rejection_count ≥ this → user can request human review
export const MAX_PUBLISH_IMAGES = 4            // max images analysed/sent at publish (cover + 3 extras)
export const DESCRIPTION_BONUS_MULT = 0.20     // +20% XP if description deemed relevant
