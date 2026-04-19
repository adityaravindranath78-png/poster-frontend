import {getPresignedUploadUrl, uploadFileToS3} from './user';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function inferMime(fileUri: string, explicitMime?: string): string {
  if (explicitMime && EXT_TO_MIME[explicitMime.split('/')[1] ?? '']) {
    return explicitMime;
  }
  const ext = (fileUri.split('.').pop() ?? '').toLowerCase().split('?')[0];
  return EXT_TO_MIME[ext] ?? 'image/jpeg';
}

export async function uploadImage(
  fileUri: string,
  folder: string,
  mimeType?: string,
): Promise<string> {
  const contentType = inferMime(fileUri, mimeType);
  const ext = contentType.split('/')[1];
  const filename = `${folder}/${Date.now()}.${ext}`;

  const {uploadUrl, fileUrl} = await getPresignedUploadUrl(
    filename,
    contentType,
  );

  await uploadFileToS3(uploadUrl, fileUri, contentType);
  return fileUrl;
}

export async function uploadProfilePhoto(
  fileUri: string,
  mimeType?: string,
): Promise<string> {
  return uploadImage(fileUri, 'profiles', mimeType);
}

export async function uploadLogo(
  fileUri: string,
  mimeType?: string,
): Promise<string> {
  return uploadImage(fileUri, 'logos', mimeType);
}
