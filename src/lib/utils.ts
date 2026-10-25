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

  // 1. Try modern navigator.clipboard API first
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying DOM fallback:', err);
    }
  }

  // 2. Bulletproof Fallback for iOS Safari, Android Chrome, and in-app webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // CRITICAL for mobile WebKit & Android:
    // DO NOT use pointer-events: none (blocks element focusing)
    // DO NOT use readonly attribute (iOS Safari blocks execCommand('copy') on readonly elements)
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.fontSize = '16px'; // Prevents mobile viewport zooming
    textArea.style.opacity = '0.01';
    textArea.style.zIndex = '99999';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch (err) {
    console.error('execCommand copy fallback failed:', err);
  }

  return false;
}

export async function copyImageToClipboard(imageUrlOrDataUrl: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !(navigator.clipboard as any)?.write || typeof ClipboardItem === 'undefined') {
      return false;
    }

    // Modern browsers allow passing Promise<Blob> directly to ClipboardItem so user activation is NOT lost during async fetch
    const blobPromise = (async () => {
      const res = await fetch(imageUrlOrDataUrl);
      const blob = await res.blob();
      if (blob.type === 'image/png') return blob;

      return new Promise<Blob>((resolve, reject) => {
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
    })();

    await (navigator.clipboard as any).write([
      new ClipboardItem({ 'image/png': blobPromise })
    ]);
    return true;
  } catch (err) {
    console.warn('Image clipboard copy failed (normal on restricted mobile browsers):', err);
    return false;
  }
}

export function downloadImageFile(dataUrlOrUrl: string, filename: string): void {
  try {
    const a = document.createElement('a');
    a.href = dataUrlOrUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
    }, 200);
  } catch (err) {
    console.warn('Image download failed:', err);
  }
}

