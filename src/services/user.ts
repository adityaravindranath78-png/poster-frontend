import RNFS from 'react-native-fs';
import api from './api';
import {UserProfile} from '../types/user';
import {ApiResponse} from '../types/api';

export async function getProfile(): Promise<ApiResponse<UserProfile>> {
  const {data} = await api.get('/user/profile');
  return data;
}

export async function updateProfile(
  updates: Partial<UserProfile>,
): Promise<ApiResponse<UserProfile>> {
  const {data} = await api.put('/user/profile', updates);
  return data;
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
): Promise<{uploadUrl: string; fileUrl: string}> {
  const {data} = await api.post('/upload/presigned-url', {
    filename,
    contentType,
  });
  return data.data;
}

// Strip "file://" prefix — RNFS expects a plain path.
function toLocalPath(uri: string): string {
  return uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
}

// Decode base64 → Uint8Array (avoids empty-blob bug with fetch(file://).blob()
// that Android RN hits for cropped picker files).
function base64ToBytes(base64: string): Uint8Array {
  const binary = global.atob ? global.atob(base64) : decodeBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64(s: string): string {
  // RN ships atob in newer versions; keep a minimal fallback for safety.
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;
  const clean = s.replace(/=+$/, '');
  for (let i = 0; i < clean.length; i++) {
    const idx = chars.indexOf(clean[i]);
    if (idx < 0) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export async function uploadFileToS3(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const localPath = toLocalPath(fileUri);
  let base64: string;
  try {
    base64 = await RNFS.readFile(localPath, 'base64');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    throw new Error(`Could not read image: ${msg}`);
  }

  const bytes = base64ToBytes(base64);
  if (bytes.byteLength === 0) {
    throw new Error('Image is empty after read');
  }

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `S3 upload ${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim(),
    );
  }
}
