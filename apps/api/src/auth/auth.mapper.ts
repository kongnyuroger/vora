import type { User as PrismaUser } from '@prisma/client';
import type { User as PublicUser, Language, Role } from '@vora/shared';

export function toPublicUser(user: PrismaUser): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as unknown as Role,
    language: user.language as Language,
    avatarUrl: user.avatarUrl,
    walletBalanceXaf: user.walletBalanceXaf,
    createdAt: user.createdAt.toISOString(),
  };
}
