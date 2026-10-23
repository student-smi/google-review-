import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  QrCode as QrIcon,
  Printer,
  FileText,
  Layers,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Palette,
  Eye
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { BusinessItem } from './DashboardLayout';

export function QrStudioPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();

  // QR Customization State - Dynamic based on active business
  const defaultShortCode = activeBusiness?.slug
    ? `${activeBusiness.slug}-counter`
    : activeBusiness?.id
    ? `qr-${activeBusiness.id.slice(-6)}`
    : 'counter';

  const [shortCode, setShortCode] = useState(defaultShortCode);
  const [headline, setHeadline] = useState('Share Your Real Experience On Google');
  const [subheadline, setSubheadline] = useState('Scan with your phone camera or Google Lens');
  const [dotColor, setDotColor] = useState(activeBusiness?.brandColor || '#4338CA');
  const [dotType, setDotType] = useState<'rounded' | 'dots' | 'classy' | 'square'>('rounded');
  const [cornerSquareType, setCornerSquareType] = useState<'extra-rounded' | 'square' | 'dot'>('extra-rounded');
  const [posterFormat, setPosterFormat] = useState<'table-tent' | 'counter-a4' | 'round-sticker'>('table-tent');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (activeBusiness?.id) {
      if (activeBusiness.brandColor) {
        setDotColor(activeBusiness.brandColor);
      }
      // Check existing QR codes for this business
      apiFetch<{ qrCodes: Array<{ code: string; label: string }> }>(
        `/api/qr/business/${activeBusiness.id}`
      )
        .then((res) => {
          if (res?.qrCodes && res.qrCodes.length > 0) {
            setShortCode(res.qrCodes[0].code);
          } else if (activeBusiness.slug) {
            setShortCode(`${activeBusiness.slug}-counter`);
          }
        })
        .catch(() => {
          if (activeBusiness.slug) {
            setShortCode(`${activeBusiness.slug}-counter`);
          }
        });
    }
  }, [activeBusiness]);

  const qrRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  // Target customer URL
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${shortCode}`
    : `https://reviewqr.panchalsmit.workers.dev/r/${shortCode}`;

  useEffect(() => {
    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new QRCodeStyling({
        width: 220,
        height: 220,
        type: 'svg',
        data: targetUrl,
        dotsOptions: {
          color: dotColor,
          type: dotType as any
        },
        cornersSquareOptions: {
          color: dotColor,
          type: cornerSquareType as any
        },
        cornersDotOptions: {
          color: dotColor,
          type: 'dot'
        },
        backgroundOptions: {
          color: '#ffffff'
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 6
        }
      });

      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrInstanceRef.current.append(qrRef.current);
      }
    } else {
      qrInstanceRef.current.update({
        data: targetUrl,
        dotsOptions: {
          color: dotColor,
          type: dotType as any
        },
        cornersSquareOptions: {
          color: dotColor,
          type: cornerSquareType as any
        }
      });
    }
  }, [targetUrl, dotColor, dotType, cornerSquareType]);

  const handleDownloadQr = (extension: 'png' | 'svg') => {
    if (qrInstanceRef.current) {
      qrInstanceRef.current.download({
        name: `${shortCode}-qr`,
        extension
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ClickUp 4.0 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              QR Studio & Poster Designer
            </h1>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              Client Vector Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate high-resolution acrylic table-tents and counter stands with zero print raster distortion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Short Link'}</span>
          </Button>

          <a href={`/r/${shortCode}`} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview Customer Flow</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Split Grid: Left Studio Controls, Right Photorealistic Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Design Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Format Selector */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-purple-600" />
                <span>1. Form Factor & Dimensions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPosterFormat('table-tent')}
                  className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                    posterFormat === 'table-tent'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/10 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  <FileText className="h-4 w-4 mx-auto mb-1.5 text-purple-600" />
                  <span className="text-xs block">Table-Tent</span>
                  <span className="text-[10px] text-slate-400">A6 Acrylic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosterFormat('counter-a4')}
                  className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                    posterFormat === 'counter-a4'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/10 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  <Printer className="h-4 w-4 mx-auto mb-1.5 text-indigo-600" />
                  <span className="text-xs block">Counter Stand</span>
                  <span className="text-[10px] text-slate-400">A4 Acrylic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosterFormat('round-sticker')}
                  className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                    posterFormat === 'round-sticker'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/10 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  <Layers className="h-4 w-4 mx-auto mb-1.5 text-pink-600" />
                  <span className="text-xs block">Round Sticker</span>
                  <span className="text-[10px] text-slate-400">Vinyl 3"</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Copy & Branding */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-purple-600" />
                <span>2. Headline & Dynamic Link</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short-Code Identifier
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    /r/
                  </span>
                  <Input
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    className="font-mono text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Poster Call to Action
                </Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Instruction Subtext
                </Label>
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Palette & QR Dot Style */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-purple-600" />
                <span>3. Vector QR Style & Colors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Theme Color Palette
                </Label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={dotColor}
                    onChange={(e) => setDotColor(e.target.value)}
                    className="h-9 w-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-800 p-0.5"
                  />
                  <div className="flex gap-2">
                    {[
                      { hex: '#4338CA', label: 'Indigo' },
                      { hex: '#059669', label: 'Emerald' },
                      { hex: '#D97706', label: 'Saffron' },
                      { hex: '#09090B', label: 'Obsidian' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setDotColor(c.hex)}
                        title={c.label}
                        className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                          dotColor === c.hex ? 'border-purple-600 ring-2 ring-purple-500/20' : 'border-slate-300 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dot Pattern
                  </Label>
                  <select
                    value={dotType}
                    onChange={(e) => setDotType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="dots">Dots</option>
                    <option value="classy">Classy</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Corner Frame
                  </Label>
                  <select
                    value={cornerSquareType}
                    onChange={(e) => setCornerSquareType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="extra-rounded">Extra Rounded</option>
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                  </select>
                </div>
              </div>

              {/* Save & Download Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={async () => {
                    if (!activeBusiness?.id) return;
                    try {
                      await apiFetch(`/api/qr/business/${activeBusiness.id}`, {
                        method: 'POST',
                        body: JSON.stringify({
                          label: headline || `${posterFormat.toUpperCase()} Standee`,
                          code: shortCode,
                          styleJson: {
                            dots: dotType,
                            cornersSquare: cornerSquareType,
                            cornersDot: 'dot',
                            color: dotColor
                          }
                        })
                      });
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 2500);
                    } catch (err) {
                      console.warn('Could not save QR to business:', err);
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                >
                  {isSaved ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{isSaved ? 'Saved to Your Active Standees!' : 'Save This Standee to Location'}</span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadQr('png')}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PNG</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadQr('svg')}
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Vector SVG</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Studio Presentation Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-purple-600" />
            <span>Photorealistic Mockup ({posterFormat.toUpperCase()})</span>
          </div>

          {/* Standee Shadow Stage */}
          <div className="w-full max-w-md p-6 sm:p-10 rounded-3xl bg-radial from-slate-100 to-slate-200/50 dark:from-slate-900/60 dark:to-slate-950/80 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
            {/* Real Mockup Box */}
            <div
              ref={posterRef}
              className={`w-full max-w-sm rounded-3xl bg-white text-slate-900 p-7 shadow-2xl flex flex-col items-center text-center transition-all border border-slate-200/90 ${
                posterFormat === 'round-sticker' ? 'rounded-full aspect-square justify-center p-9' : ''
              }`}
            >
              {/* Business Badge */}
              <div className="space-y-1.5 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-extrabold shadow-2xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                  <span>{activeBusiness?.name || 'My Business'}</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 leading-snug">
                  {headline}
                </h3>
              </div>

              {/* QR Container Frame */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm my-1">
                <div ref={qrRef} className="flex items-center justify-center" />
              </div>

              {/* Official Google Badge */}
              <div className="space-y-1.5 mt-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-800">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Reviews</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  {subheadline}
                </p>
                <div className="text-[10px] font-mono text-slate-400">
                  reviewqr.in/r/{shortCode}
                </div>
              </div>
            </div>

            {/* Reflection / Stand base shadow */}
            <div className="w-56 h-3 bg-slate-400/20 dark:bg-black/40 rounded-full blur-xs mt-3" />
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>High-res vector QR works with any smartphone camera and Google Lens</span>
          </div>
        </div>
      </div>
    </div>
  );
}
