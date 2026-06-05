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

/**
 * Given a stored value (full object URL or raw key), return just the S3 key.
 */
export const keyFromUrl = (value = '') => {
  const marker = `/${BUCKET}/`;
  if (value.includes(marker)) return value.slice(value.indexOf(marker) + marker.length);
  if (value.startsWith(`s3://${BUCKET}/`)) return value.slice(`s3://${BUCKET}/`.length);
  return value; // already a key
};

/**
 * Download an object from R2/S3 and return its Buffer.
 */
export const downloadFromS3 = async (keyOrUrl) => {
  const key = keyFromUrl(keyOrUrl);
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return Buffer.from(await res.Body.transformToByteArray());
};
