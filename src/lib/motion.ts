/** Unified motion — subtle springs and short fades for launch polish. */
export const easeOut = [0.25, 0.1, 0.25, 1] as const;

export const fade = {
  in: { duration: 0.22, ease: easeOut },
  out: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
} as const;

export const spring = {
  /** Header / chips */
  ui: { type: "spring" as const, stiffness: 420, damping: 36 },
  /** Sheets & modals */
  sheet: { type: "spring" as const, stiffness: 400, damping: 38 },
  /** Inner content blocks */
  soft: { type: "spring" as const, stiffness: 380, damping: 34 },
} as const;
