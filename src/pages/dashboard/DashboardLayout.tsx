import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/app/Sidebar';
import { Header } from '@/components/app/Header';
import { CommandPalette } from '@/components/app/CommandPalette';

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  googleReviewUrl: string;
  brandColor: string;
  brandColorSecondary: string;
  logoUrl?: string | null;
}

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Active business & locations state
  const [businesses, setBusinesses] = useState<BusinessItem[]>([
    {
      id: 'demo-biz-1',
      name: 'Royal Sweets & Bakery',
      slug: 'royal-sweets',
      city: 'Ahmedabad',
      googleReviewUrl: 'https://g.page/r/royal-sweets/review',
      brandColor: '#4338CA',
      brandColorSecondary: '#D97706'
    }
  ]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('demo-biz-1');

  useEffect(() => {
    // Attempt to load from API
    fetch('/api/businesses')
      .then((res) => (res.ok ? (res.json() as Promise<any>) : null))
      .then((data) => {
        if (data?.businesses && data.businesses.length > 0) {
          setBusinesses(data.businesses);
          setActiveBusinessId(data.businesses[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0] || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          activeBusiness={activeBusiness}
          businesses={businesses}
          onSelectBusiness={(id) => setActiveBusinessId(id)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ activeBusiness, businesses }} />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        activeBusiness={activeBusiness}
      />
    </div>
  );
}
