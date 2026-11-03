import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Sparkles,
  Printer,
  Star,
  Smartphone,
  Check,
  Store,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeaderStandeeModalProps {
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

export function HeaderStandeeModal({ isOpen, onClose, business }: HeaderStandeeModalProps) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const standeeCardRef = useRef<HTMLDivElement>(null);

  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${business?.slug || business?.id || ''}`
    : `https://reviewqr.panchalsmit.workers.dev/r/${business?.slug || business?.id || ''}`;

  useEffect(() => {
    if (!isOpen || !qrRef.current || !business) return;

    qrRef.current.innerHTML = '';
    const color = business.brandColor || '#0F172A';

    const qr = new QRCodeStyling({
      width: 170,
      height: 170,
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

  const handleDownloadImage = async () => {
    if (!standeeCardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(standeeCardRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      const safeName = (business.name || 'standee').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `${safeName}-acrylic-standee.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export standee image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Standee View</h3>
              <p className="text-[11px] text-slate-500">Countertop Acrylic Display Mockup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3D Standee Mockup Container */}
        <div className="py-5 flex flex-col items-center justify-center bg-radial from-slate-50 to-slate-100/80 rounded-2xl my-3 p-4">
          {/* Standee Acrylic Body */}
          <div
            ref={standeeCardRef}
            className="relative w-[240px] sm:w-[260px] rounded-2xl bg-white border border-slate-200 shadow-xl p-5 text-center flex flex-col items-center overflow-hidden"
          >
            {/* Gloss reflection highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/70 via-white/10 to-transparent pointer-events-none rounded-tr-2xl" />

            {/* Google Brand Tag */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-slate-700 text-[10px] font-extrabold uppercase tracking-wide shadow-2xs mb-2">
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Review on Google</span>
            </div>

            {/* Business Name */}
            <h4 className="text-base font-black text-slate-900 leading-tight truncate max-w-[210px] mt-1">
              {business.name}
            </h4>
            {business.city && (
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{business.city}</p>
            )}

            {/* Gold Rating Stars */}
            <div className="flex items-center gap-0.5 my-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* QR Frame */}
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-2xs my-1">
              <div ref={qrRef} className="flex items-center justify-center w-[170px] h-[170px]" />
            </div>

            {/* Scan Instruction */}
            <p className="mt-2 text-[10px] font-bold text-slate-600">
              Point phone camera to review in 5 seconds
            </p>

            {/* NFC indicator */}
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-200">
              <Smartphone className="h-2.5 w-2.5" />
              <span>NFC Tap & Scan Enabled</span>
            </div>
          </div>

          {/* Stand Mockup Base (wooden / acrylic countertop base) */}
          <div className="mt-1 h-3 w-48 sm:w-56 rounded-md bg-gradient-to-b from-slate-700 to-slate-900 shadow-md border-t border-slate-600" />
          <div className="h-1.5 w-40 sm:w-48 bg-slate-300/60 rounded-full blur-xs -mt-0.5" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            size="sm"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Saving...' : 'Download Image'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              navigate('/dashboard/qr');
            }}
            className="w-full font-bold text-xs rounded-xl border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>QR Studio</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

