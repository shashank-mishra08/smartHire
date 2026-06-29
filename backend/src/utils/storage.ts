import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function uploadToFirebase(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const bucket = getStorage().bucket();
  const filename = `${uuidv4()}${path.extname(originalname)}`;
  const file = bucket.file(`resumes/${filename}`);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
    },
    public: true, // Make file public for download
  });

  // Since public: true is set, we can generate a public URL
  return `https://storage.googleapis.com/${bucket.name}/resumes/${filename}`;
}
