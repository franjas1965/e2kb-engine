import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(redisUrl);
  }
  return redis;
}

export interface ConversionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  filename: string;
  email?: string;
  progress?: string;
  error?: string;
  downloadPath?: string;
  createdAt: number;
  completedAt?: number;
}

const JOB_PREFIX = 'e2kb:job:';
const JOB_EXPIRY = 24 * 60 * 60; // 24 hours

export async function createJob(job: ConversionJob): Promise<void> {
  const r = getRedis();
  await r.setex(`${JOB_PREFIX}${job.id}`, JOB_EXPIRY, JSON.stringify(job));
}

export async function getJob(jobId: string): Promise<ConversionJob | null> {
  const r = getRedis();
  const data = await r.get(`${JOB_PREFIX}${jobId}`);
  if (!data) return null;
  return JSON.parse(data);
}

export async function updateJob(jobId: string, updates: Partial<ConversionJob>): Promise<void> {
  const job = await getJob(jobId);
  if (!job) return;
  
  const updated = { ...job, ...updates };
  const r = getRedis();
  await r.setex(`${JOB_PREFIX}${jobId}`, JOB_EXPIRY, JSON.stringify(updated));
}

export async function deleteJob(jobId: string): Promise<void> {
  const r = getRedis();
  await r.del(`${JOB_PREFIX}${jobId}`);
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const r = getRedis();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}
