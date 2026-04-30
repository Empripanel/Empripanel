import { mapApiMessage } from '../src/shared/userMessages';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

const CLOUDINARY_UPLOAD_URL =
  CLOUDINARY_CLOUD_NAME != null
    ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    : '';

/**
 * Upload a file to Cloudinary (unsigned). Returns the secure_url.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'La subida de imágenes no está configurada. Contactá al administrador del sitio.'
    );
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      mapApiMessage(data.error?.message, 'No se pudo subir la imagen. Intentá con otra o más tarde.')
    );
  }
  const secureUrl = data.secure_url;
  if (typeof secureUrl !== 'string' || !secureUrl) {
    throw new Error('No pudimos procesar la respuesta del servidor de imágenes.');
  }
  return secureUrl;
}

const URL_REGEX = /^https?:\/\/.+/i;

/**
 * Returns true if the string looks like a valid HTTP(S) URL.
 */
export function isValidImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
