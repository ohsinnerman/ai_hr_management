import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../config/s3.js';

const BUCKET = process.env.S3_BUCKET || 'nexushr';

/**
 * Upload a buffer to R2/S3 and return a stable object URL.
 * The returned URL is endpoint/bucket/key; downloads should use a signed URL.
 */
export const uploadToS3 = async (key, buffer, contentType = 'application/octet-stream') => {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
  );
  const base = (process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
  return base ? `${base}/${BUCKET}/${key}` : `s3://${BUCKET}/${key}`;
};

/**
 * Generate a time-limited signed URL to download a private object.
 */
export const getSignedDownloadUrl = async (key, expiresIn = 3600) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
