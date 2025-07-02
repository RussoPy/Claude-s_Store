// src/utils/rateLimiter.ts
// Simple in-memory rate limiter for frontend actions
// Usage: if (rateLimiter.canRun('addToCart')) { ... }

const actionTimestamps: Record<string, number> = {};

// Default cooldowns (ms) per action
type CooldownMap = {
  [action: string]: number;
};

const defaultCooldowns: CooldownMap = {
  addToCart: 400, // 1.5 seconds
  checkout: 4000,  // 4 seconds
  applyCoupon: 2000, // 2 seconds
};

export const rateLimiter = {
  canRun(action: string, cooldownOverride?: number): boolean {
    const now = Date.now();
    const cooldown = cooldownOverride ?? defaultCooldowns[action] ?? 1000;
    const last = actionTimestamps[action] || 0;
    if (now - last >= cooldown) {
      actionTimestamps[action] = now;
      return true;
    }
    return false;
  },
  // Optionally, reset an action's timer
  reset(action: string) {
    actionTimestamps[action] = 0;
  },
};
