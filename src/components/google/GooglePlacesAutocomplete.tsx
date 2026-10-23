import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, CheckCircle2, Loader2, Store, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  address: string;
  rating?: number | null;
  userRatingCount?: number;
  googleMapsUri?: string;
  googleReviewUrl: string;
}

interface GooglePlacesAutocompleteProps {
  initialValue?: string;
  onSelect: (place: GooglePlaceDetails) => void;
  placeholder?: string;
  className?: string;
}

export function GooglePlacesAutocomplete({
  initialValue = '',
  onSelect,
  placeholder = 'Search business name or location on Google Maps...',
  className = ''
}: GooglePlacesAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; name: string; address: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceDetails | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (selectedPlace && query === selectedPlace.name) {
      return;
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/places/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json() as any;
          setSuggestions(data.suggestions || []);
          setIsOpen((data.suggestions || []).length > 0);
        }
      } catch (err) {
        console.error('Failed to search Google Places:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, selectedPlace]);

  const handleSelect = async (placeId: string, fallbackName: string) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      const res = await fetch(`/api/public/places/details/${placeId}`);
      if (res.ok) {
        const details = await res.json() as GooglePlaceDetails;
        setSelectedPlace(details);
        setQuery(details.name);
        onSelect(details);
      } else {
        // Fallback
        const fallback: GooglePlaceDetails = {
          placeId,
          name: fallbackName,
          address: '',
          googleReviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`
        };
        setSelectedPlace(fallback);
        setQuery(fallbackName);
        onSelect(fallback);
      }
    } catch (err) {
      console.error('Failed to fetch place details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-2.5 ${className}`}>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedPlace && e.target.value !== selectedPlace.name) {
              setSelectedPlace(null);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0 && !selectedPlace) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-24 h-11 text-sm bg-card"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
            Google Places
          </Badge>
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Google Maps Listings
          </div>
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s.placeId, s.name)}
              className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left hover:bg-secondary/80 transition-colors cursor-pointer group"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="truncate flex-1">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {s.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Verified Place Card */}
      {selectedPlace && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>{selectedPlace.name}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </h4>
                <p className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                  {selectedPlace.address}
                </p>
              </div>
            </div>

            {selectedPlace.rating && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{selectedPlace.rating}</span>
                {selectedPlace.userRatingCount && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({selectedPlace.userRatingCount})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/15 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Google Review link auto-generated
            </span>
            {selectedPlace.googleReviewUrl && (
              <a
                href={selectedPlace.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Test Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
