import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

export interface JobData {
  status: 'processing' | 'completed' | 'error';
  progress?: string;
  error?: string;
  zipPath?: string;
  filename?: string;
  email?: string;
  createdAt: number;
}

const JOB_PREFIX = 'job:';
const JOB_TTL = 24 * 60 * 60; // 24 hours

export async function setJob(jobId: string, data: JobData): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(`${JOB_PREFIX}${jobId}`, JOB_TTL, JSON.stringify(data));
}

export async function getJob(jobId: string): Promise<JobData | null> {
  const client = await getRedisClient();
  const data = await client.get(`${JOB_PREFIX}${jobId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteJob(jobId: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(`${JOB_PREFIX}${jobId}`);
}
