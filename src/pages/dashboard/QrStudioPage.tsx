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
  ExternalLink
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';

export function QrStudioPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();

  // QR Customization State
  const [shortCode, setShortCode] = useState('royal-counter');
  const [headline, setHeadline] = useState('Share Your Real Experience On Google');
  const [subheadline, setSubheadline] = useState('Scan with any camera app or Google Lens');
  const [dotColor, setDotColor] = useState('#4338CA');
  const [dotType, setDotType] = useState<'rounded' | 'dots' | 'classy' | 'square'>('rounded');
  const [cornerSquareType, setCornerSquareType] = useState<'extra-rounded' | 'square' | 'dot'>('extra-rounded');
  const [posterFormat, setPosterFormat] = useState<'table-tent' | 'counter-a4' | 'round-sticker'>('table-tent');
  const [copied, setCopied] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  // Target customer URL
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${shortCode}`
    : `https://reviewqr.in/r/${shortCode}`;

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
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              QR Studio & Poster Generator
            </h1>
            <Badge variant="saffron" className="text-xs">Client-Side Export</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Custom branded QR posters rendered right in your browser. Saves Workers CPU and bandwidth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Short Link'}</span>
          </Button>
          <a href={`/r/${shortCode}`} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview Customer Flow</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Split Layout: Controls on Left, Live Poster Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Format Template</CardTitle>
              <CardDescription>Choose poster dimensions for your physical setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPosterFormat('table-tent')}
                  className={`rounded-xl border p-3 text-xs font-semibold text-center transition-all ${
                    posterFormat === 'table-tent'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4 mx-auto mb-1.5" />
                  <span>Table-Tent (A6)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterFormat('counter-a4')}
                  className={`rounded-xl border p-3 text-xs font-semibold text-center transition-all ${
                    posterFormat === 'counter-a4'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <Printer className="h-4 w-4 mx-auto mb-1.5" />
                  <span>Counter (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterFormat('round-sticker')}
                  className={`rounded-xl border p-3 text-xs font-semibold text-center transition-all ${
                    posterFormat === 'round-sticker'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4 mx-auto mb-1.5" />
                  <span>Sticker (Round)</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Branding & Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Dynamic Short-Code Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono bg-secondary px-2.5 py-2 rounded-xl border border-border">
                    /r/
                  </span>
                  <Input
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Poster Headline</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Subheadline / Instructions</Label>
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. QR Style & Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Primary QR Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={dotColor}
                    onChange={(e) => setDotColor(e.target.value)}
                    className="h-10 w-12 rounded-lg cursor-pointer border border-border p-1"
                  />
                  <div className="flex gap-2">
                    {['#4338CA', '#065F46', '#09090B', '#D97706'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDotColor(c)}
                        className="h-7 w-7 rounded-full border border-border transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Dot Style</Label>
                  <select
                    value={dotType}
                    onChange={(e) => setDotType(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="dots">Dots</option>
                    <option value="classy">Classy</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Corner Frame</Label>
                  <select
                    value={cornerSquareType}
                    onChange={(e) => setCornerSquareType(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs"
                  >
                    <option value="extra-rounded">Extra Rounded</option>
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                  </select>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="pt-2 flex gap-2">
                <Button
                  variant="saffron"
                  size="sm"
                  onClick={() => handleDownloadQr('png')}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PNG</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQr('svg')}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Download SVG</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Poster Mock Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Live Print Preview ({posterFormat})
          </div>

          {/* Printable Poster Mock Box */}
          <div
            ref={posterRef}
            className={`w-full max-w-sm rounded-3xl border-2 border-border/80 bg-white text-slate-900 p-8 shadow-2xl flex flex-col items-center text-center transition-all ${
              posterFormat === 'round-sticker' ? 'rounded-full aspect-square justify-center p-10' : ''
            }`}
          >
            {/* Top Business Name */}
            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                <span>{activeBusiness?.name || 'Royal Sweets & Bakery'}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                {headline}
              </h3>
            </div>

            {/* QR Center Container with subtle frame */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm my-2">
              <div ref={qrRef} className="flex items-center justify-center" />
            </div>

            {/* Google Badge & Instructions */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google Reviews</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {subheadline}
              </p>
              <div className="text-[10px] font-mono text-slate-400">
                reviewqr.in/r/{shortCode}
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>High-res vector QR works with all smartphones and Google Lens</span>
          </div>
        </div>
      </div>
    </div>
  );
}
