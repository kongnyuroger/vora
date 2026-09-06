import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

interface OtpEntry {
  code: string;
  expiresAt: number;
  role?: Role;
}

/**
 * In-memory, single-instance OTP store — fine for the hackathon's
 * dev-mode OTP flow (docs/VORA-BUILD.md §8 Branch 1). Swap for a
 * Redis/DB-backed store before any multi-instance deployment.
 */
@Injectable()
export class OtpStore {
  private readonly store = new Map<string, OtpEntry>();

  set(phone: string, code: string, ttlMs: number, role?: Role) {
    this.store.set(phone, { code, expiresAt: Date.now() + ttlMs, role });
  }

  /**
   * Checks the code without consuming it, so a downstream failure (e.g.
   * the database being unreachable) doesn't burn an otherwise-valid code
   * before the caller has actually finished logging the user in.
   */
  check(phone: string, code: string): { valid: boolean; role?: Role } {
    const entry = this.store.get(phone);
    if (!entry) return { valid: false };

    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      return { valid: false };
    }

    if (entry.code !== code) return { valid: false };

    return { valid: true, role: entry.role };
  }

  /** Call once the login this code was for has actually succeeded. */
  consume(phone: string) {
    this.store.delete(phone);
  }
}
