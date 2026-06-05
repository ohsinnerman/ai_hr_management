import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  // Path-style addressing works with both Cloudflare R2 and S3-compatible
  // stores like MinIO (virtual-host style requires DNS per-bucket).
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});
