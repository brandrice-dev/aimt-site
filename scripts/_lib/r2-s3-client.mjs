// Minimal, dependency-free AWS SigV4 client for Cloudflare R2's
// S3-compatible API. No aws-sdk, no npm install -- Node's built-in
// crypto + fetch only, matching this repo's zero-npm-dependency
// convention for scripts/ and functions/api/.
//
// R2 endpoint shape: https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/<key>
// Region is always "auto"; service is "s3". Uses simple (non-multipart)
// PUT/GET/HEAD -- R2 accepts single-request PUT up to 5GiB, which covers
// every file this workflow currently handles (largest so far: ~88MB). A
// future module with multi-GB video would need multipart added; not
// needed at today's file sizes.

import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

function sha256Hex(bufferOrString) {
  return createHash('sha256').update(bufferOrString).digest('hex');
}

function hmac(key, data) {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256File(filePath) {
  return sha256Hex(readFileSync(filePath));
}

function uriEncode(str, encodeSlash = true) {
  let out = encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  if (!encodeSlash) out = out.replace(/%2F/g, '/');
  return out;
}

// Reads R2 credentials from the environment. Fails closed with a clear,
// specific message rather than proceeding with partial/missing config --
// per the locked requirement that this workflow must never silently skip
// cloud auth. Never logs the actual secret value.
function requireR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'aimt-media-archive';

  const missing = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');

  if (missing.length > 0) {
    throw new Error(
      `R2 credentials not available: missing ${missing.join(', ')}. ` +
      `This workflow will not proceed without them -- no cloud call will be made. ` +
      `Set these as environment variables (an R2 API token with object read/write ` +
      `scope on bucket "${bucket}", generated from the Cloudflare dashboard) before ` +
      `running this script.`
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function endpointFor(accountId) {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

// Builds the SigV4 Authorization header + supporting headers for a single
// R2 request. `payloadHash` must be the hex sha256 of the request body
// ('' for GET/HEAD with no body -> sha256 of empty string).
function signRequest({ method, host, path, accessKeyId, secretAccessKey, payloadHash, extraHeaders = {} }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const canonicalUri = path.split('/').map((seg) => uriEncode(seg, false)).join('/');
  const headers = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, ...extraHeaders };
  const sortedHeaderNames = Object.keys(headers).map((h) => h.toLowerCase()).sort();
  const canonicalHeaders = sortedHeaderNames.map((h) => `${h}:${String(headers[Object.keys(headers).find((k) => k.toLowerCase() === h)]).trim()}\n`).join('');
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const kDate = hmac('AWS4' + secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { 'x-amz-date': amzDate, 'x-amz-content-sha256': payloadHash, authorization };
}

async function r2Request(config, { method, key, body, contentType }) {
  const { accountId, accessKeyId, secretAccessKey, bucket } = config;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const path = `/${bucket}/${key}`;
  const payloadHash = body ? sha256Hex(body) : sha256Hex('');

  const extraHeaders = {};
  if (contentType) extraHeaders['content-type'] = contentType;

  const signed = signRequest({ method, host, path, accessKeyId, secretAccessKey, payloadHash, extraHeaders });

  const headers = {
    host,
    'x-amz-date': signed['x-amz-date'],
    'x-amz-content-sha256': signed['x-amz-content-sha256'],
    authorization: signed.authorization
  };
  if (contentType) headers['content-type'] = contentType;

  const res = await fetch(endpointFor(accountId) + path, { method, headers, body });
  return res;
}

async function r2HeadObject(config, key) {
  const res = await r2Request(config, { method: 'HEAD', key });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 HEAD ${key} failed: ${res.status} ${await res.text().catch(() => '')}`);
  return { size: Number(res.headers.get('content-length') || 0), contentType: res.headers.get('content-type') };
}

async function r2PutObject(config, key, body, contentType) {
  const res = await r2Request(config, { method: 'PUT', key, body, contentType });
  if (!res.ok) throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text().catch(() => '')}`);
  return true;
}

async function r2GetObject(config, key) {
  const res = await r2Request(config, { method: 'GET', key });
  if (!res.ok) throw new Error(`R2 GET ${key} failed: ${res.status} ${await res.text().catch(() => '')}`);
  return Buffer.from(await res.arrayBuffer());
}

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.png': 'image/png'
};
function mimeTypeFor(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function contentAddressedKey(sha256, filename) {
  return `blobs/sha256/${sha256.slice(0, 2)}/${sha256}/${filename}`;
}

export {
  sha256Hex,
  sha256File,
  mimeTypeFor,
  contentAddressedKey,
  requireR2Config,
  signRequest,
  r2Request,
  r2HeadObject,
  r2PutObject,
  r2GetObject
};
