import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, PaymentStatus, isMomoMethod } from '@vora/shared';
import type {
  CollectRequest,
  CollectResult,
  PaymentProvider,
} from './payment-provider.interface';

const DEFAULT_BASE_URL = 'https://demo.campay.net';
/** Renew a little before the real expiry so a request never races the cutoff. */
const TOKEN_SAFETY_MARGIN_MS = 60_000;

interface CampayTokenResponse {
  token: string;
  expires_in?: number;
}

interface CampayCollectResponse {
  reference?: string;
  ussd_code?: string;
  operator?: string;
  message?: string;
}

interface CampayTransactionResponse {
  status?: string;
  reason?: string;
  operator?: string;
  code?: string;
}

/**
 * Campay MoMo collection (MTN + Orange) against the sandbox at demo.campay.net.
 * The subscriber approves on their handset, so a collect starts PENDING and is
 * resolved by polling — Campay's webhook would need a public URL we don't have
 * during a hackathon build.
 */
@Injectable()
export class CampayProvider implements PaymentProvider {
  readonly name = 'campay';

  private readonly logger = new Logger(CampayProvider.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  supports(method: PaymentMethod): boolean {
    return isMomoMethod(method) && this.isConfigured();
  }

  isConfigured(): boolean {
    return !!this.credentials();
  }

  async collect(request: CollectRequest): Promise<CollectResult> {
    const body = {
      amount: String(request.amountXaf),
      currency: 'XAF',
      from: request.phone,
      description: request.description,
      external_reference: request.externalRef,
    };

    const res = await this.request<CampayCollectResponse>(
      'POST',
      '/api/collect/',
      body,
    );

    if (!res?.reference) {
      this.logger.warn(
        `Campay collect returned no reference: ${res?.message ?? 'unknown error'}`,
      );
      return {
        reference: `campay:failed:${request.externalRef}`,
        status: PaymentStatus.FAILED,
        failureReason: res?.message ?? 'Campay did not accept the charge',
      };
    }

    return { reference: res.reference, status: PaymentStatus.PENDING };
  }

  async getStatus(reference: string): Promise<PaymentStatus> {
    const res = await this.request<CampayTransactionResponse>(
      'GET',
      `/api/transaction/${encodeURIComponent(reference)}/`,
    );

    switch (res?.status?.toUpperCase()) {
      case 'SUCCESSFUL':
        return PaymentStatus.SUCCESS;
      case 'FAILED':
        return PaymentStatus.FAILED;
      default:
        // Unreachable provider or an unrecognised state — leave it PENDING so
        // the next poll can still settle it rather than failing a live charge.
        return PaymentStatus.PENDING;
    }
  }

  private credentials(): { username: string; password: string } | null {
    const username = this.config.get<string>('CAMPAY_API_KEY');
    const password = this.config.get<string>('CAMPAY_API_SECRET');
    if (!username || !password) return null;
    return { username, password };
  }

  private baseUrl(): string {
    return this.config.get<string>('CAMPAY_BASE_URL') ?? DEFAULT_BASE_URL;
  }

  private async token(): Promise<string | null> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const credentials = this.credentials();
    if (!credentials) return null;

    try {
      const res = await fetch(`${this.baseUrl()}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        this.logger.error(`Campay token request returned ${res.status}`);
        return null;
      }

      const data = (await res.json()) as CampayTokenResponse;
      if (!data.token) return null;

      const ttlMs = (data.expires_in ?? 3600) * 1000;
      this.cachedToken = {
        value: data.token,
        expiresAt: Date.now() + Math.max(ttlMs - TOKEN_SAFETY_MARGIN_MS, 0),
      };
      return data.token;
    } catch (err) {
      this.logger.error('Campay token request failed', err);
      return null;
    }
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T | null> {
    const token = await this.token();
    if (!token) return null;

    try {
      const res = await fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = (await res.json().catch(() => null)) as T | null;
      if (!res.ok) {
        this.logger.warn(`Campay ${method} ${path} returned ${res.status}`);
      }
      return data;
    } catch (err) {
      this.logger.error(`Campay ${method} ${path} failed`, err);
      return null;
    }
  }
}
