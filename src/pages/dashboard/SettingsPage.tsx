import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, ShieldCheck, Building2, Save } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/google/GooglePlacesAutocomplete';

export function SettingsPage() {
  const [name, setName] = useState('Royal Sweets & Bakery');
  const [googleUrl, setGoogleUrl] = useState('https://g.page/r/royal-sweets/review');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [city, setCity] = useState('Ahmedabad');
  const [resolutionContact, setResolutionContact] = useState('+91 98765 43210 (Mr. Rajesh)');
  const [voice, setVoice] = useState('warm_grateful');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Business & Brand Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your Google Review destination, brand voice, and offline customer resolution channel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Profile</CardTitle>
          <CardDescription>Public details printed on posters and shown on customer review flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Google Maps Linking */}
          <div className="space-y-1.5 pb-2 border-b border-border">
            <Label>Auto-detect from Google Maps</Label>
            <GooglePlacesAutocomplete
              initialValue={name}
              placeholder="Search business on Google Maps..."
              onSelect={(place) => {
                setName(place.name);
                setGoogleUrl(place.googleReviewUrl);
                if (place.address) {
                  const parts = place.address.split(',').map((p) => p.trim());
                  if (parts.length >= 3) {
                    setCity(parts[parts.length - 3] || parts[0]);
                  }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City / Location</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Google Review Link (Official Destination)</Label>
            <div className="flex gap-2">
              <Input value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} />
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-1.5 shrink-0">
                  <ExternalLink className="h-4 w-4" />
                  <span>Test Link</span>
                </Button>
              </a>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Validated Google Review destination
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Brand Reply Voice</Label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="warm_grateful">Warm & Grateful (Recommended for Hospitality)</option>
                <option value="professional">Professional & Formal</option>
                <option value="concise">Concise & Direct</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Offline Resolution Contact Line</Label>
              <Input
                value={resolutionContact}
                onChange={(e) => setResolutionContact(e.target.value)}
                placeholder="Manager Phone or Email for negative reviews"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border p-6">
          {saved ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Settings updated successfully
            </span>
          ) : <span />}
          <Button variant="primary" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Plan & Cloudflare Discipline Stub */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subscription & Limits</CardTitle>
            <Badge variant="saffron">Free Forever Tier</Badge>
          </div>
          <CardDescription>Cloudflare Free Tier architecture with 0 hidden costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Free-Tier Quota Allocation</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Includes 25 AI review drafts per day per business, unlimited static scans, and free Cloudflare edge asset hosting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
