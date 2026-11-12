import { Redis } from "@upstash/redis";

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryWindows = new Map<string, WindowEntry>();
let cachedRedis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis;

  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_KV_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_KV_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();

  if (url && token) {
    try {
      cachedRedis = new Redis({ url, token });
    } catch {
      cachedRedis = null;
    }
  } else {
    cachedRedis = null;
  }
  return cachedRedis;
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `mc:rl:${input.key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, input.windowSeconds);
      }
      return {
        allowed: count <= input.limit,
        remaining: Math.max(0, input.limit - count),
      };
    } catch {
      // Fallback to in-memory window if Redis is unreachable.
    }
  }

  const now = Date.now();
  const windowMs = input.windowSeconds * 1000;

  if (memoryWindows.size > 5000) {
    for (const [k, v] of memoryWindows) {
      if (v.resetAt <= now) memoryWindows.delete(k);
    }
  }

  const existing = memoryWindows.get(input.key);
  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(input.key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: input.limit - 1 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= input.limit,
    remaining: Math.max(0, input.limit - existing.count),
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
