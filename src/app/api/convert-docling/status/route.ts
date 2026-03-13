import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getJob, deleteJob } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const job = await getJob(jobId);
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // If completed, return the ZIP file
  if (job.status === 'completed' && job.zipPath) {
    try {
      const zipBuffer = fs.readFileSync(job.zipPath);
      
      // Clean up the job and file after download
      await deleteJob(jobId);
      fs.rmSync(path.dirname(job.zipPath), { recursive: true, force: true });
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${job.filename || 'e2kb-output.zip'}"`
        }
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to read result file' }, { status: 500 });
    }
  }

  // Return status for processing or error states
  return NextResponse.json({
    jobId,
    status: job.status,
    progress: job.progress,
    error: job.error
  });
}
