import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { X, Copy, Check, Download, Sparkles, ExternalLink, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeaderQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id: string;
    name: string;
    slug?: string;
    city?: string | null;
    brandColor?: string;
    logoUrl?: string;
  } | null;
}

export function HeaderQrModal({ isOpen, onClose, business }: HeaderQrModalProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${business?.slug || business?.id || ''}`
    : `https://reviewqr.panchalsmit.workers.dev/r/${business?.slug || business?.id || ''}`;

  useEffect(() => {
    if (!isOpen || !qrRef.current || !business) return;

    qrRef.current.innerHTML = '';
    const color = business.brandColor || '#1E293B';

    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      type: 'svg',
      data: reviewUrl,
      dotsOptions: {
        color: color,
        type: 'rounded'
      },
      cornersSquareOptions: {
        color: color,
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: color,
        type: 'dot'
      },
      backgroundOptions: {
        color: '#ffffff'
      }
    });

    qr.append(qrRef.current);
  }, [isOpen, reviewUrl, business]);

  if (!isOpen || !business) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const color = business.brandColor || '#1E293B';
      const qr = new QRCodeStyling({
        width: 1024,
        height: 1024,
        type: 'canvas',
        data: reviewUrl,
        dotsOptions: {
          color: color,
          type: 'rounded'
        },
        cornersSquareOptions: {
          color: color,
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          color: color,
          type: 'dot'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      });

      const blob = await qr.getRawData('png');
      if (blob) {
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (business.name || 'review-qr').toLowerCase().replace(/[^a-z0-9]/g, '-');
        a.download = `${safeName}-google-review-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download QR:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Live Review QR</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{business.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="rounded-2xl border-2 border-slate-100 bg-white p-3.5 shadow-sm">
            <div ref={qrRef} className="flex items-center justify-center w-[200px] h-[200px]" />
          </div>
          <p className="mt-2.5 text-[11px] font-semibold text-slate-400 text-center">
            Scans directly open your customer Google Review funnel
          </p>
        </div>

        {/* URL Box & Copy */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-1.5 mb-4">
          <input
            type="text"
            readOnly
            value={reviewUrl}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-600 outline-none truncate select-all"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isDownloading ? 'Saving...' : 'Download PNG'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              navigate('/dashboard/qr');
            }}
            className="w-full font-bold text-xs rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>QR Studio</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

