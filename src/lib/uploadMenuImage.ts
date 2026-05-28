import { supabase } from '@/lib/supabase/client';

const BUCKET = 'menu-images';
const MAX_EDGE_PX = 800;
const TARGET_MAX_BYTES = 400_000;
const JPEG_QUALITY_START = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Slika se ne moze ucitati.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Kompresija slike nije uspela.')),
      'image/jpeg',
      quality,
    );
  });
}

/** Resize and compress in the browser before upload (keeps phone loads small). */
export async function compressImageForUpload(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Izaberi sliku (JPG, PNG ili WebP).');
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kompresija slike nije uspela.');
  ctx.drawImage(img, 0, 0, w, h);

  let quality = JPEG_QUALITY_START;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_MAX_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
}

export async function uploadMenuImage(file: File): Promise<string> {
  const blob = await compressImageForUpload(file);
  const path = `products/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
