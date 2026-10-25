import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(timestampOrDate: number | string | Date): string {
  const date = typeof timestampOrDate === 'number' 
    ? new Date(timestampOrDate * 1000) 
    : new Date(timestampOrDate);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, using fallback:', err);
    }
  }

  // 2. Mobile-safe fallback for Safari iOS, Android Chrome, and in-app webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    // Must be in viewport for iOS/Android to allow execCommand, but visually hidden
    textArea.style.position = 'fixed';
    textArea.style.top = '10px';
    textArea.style.left = '10px';
    textArea.style.width = '100px';
    textArea.style.height = '40px';
    textArea.style.opacity = '0.01';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-999';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('All clipboard copy attempts failed:', err);
    return false;
  }
}

export async function copyImageToClipboard(imageUrlOrDataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrlOrDataUrl);
    const blob = await res.blob();
    let pngBlob = blob;

    // ClipboardItem standard expects image/png
    if (blob.type !== 'image/png') {
      pngBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
        };
        img.onerror = reject;
        img.src = imageUrlOrDataUrl;
      });
    }

    if (typeof navigator !== 'undefined' && (navigator.clipboard as any)?.write) {
      await (navigator.clipboard as any).write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      return true;
    }
  } catch (err) {
    console.warn('Image clipboard copy error:', err);
  }
  return false;
}

export function downloadImageFile(dataUrlOrUrl: string, filename: string): void {
  try {
    const a = document.createElement('a');
    a.href = dataUrlOrUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  } catch (err) {
    console.warn('Image download failed:', err);
  }
}
