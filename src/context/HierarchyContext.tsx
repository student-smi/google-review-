import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export type HierarchyLevel = 'brand' | 'business' | 'branch';

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  plan?: string;
  status?: string;
  createdAt?: number;
}

export interface BusinessItem {
  id: string;
  brandId?: string | null;
  businessType?: 'company_owned' | 'franchise' | 'independent';
  name: string;
  slug: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  assignedManager?: string | null;
  status?: 'active' | 'inactive' | 'connection_error';
  isArchived?: boolean;
  archivedAt?: number | null;
  locations?: BranchItem[];
  brandVoice?: string;
  chipsJson?: string;
  googleReviewUrl: string;
  googlePlaceId?: string | null;
  brandColor?: string;
  logoUrl?: string;
  qrCode?: {
    id: string;
    code: string;
    svgUrl?: string;
  };
}

export interface BranchItem {
  id: string;
  businessId: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  googlePlaceId?: string | null;
  googleReviewUrl?: string | null;
  status?: 'active' | 'inactive' | 'connection_error';
  isPrimary?: boolean;
  assignedManager?: string | null;
  assignedManagerId?: string | null;
  category?: string | null;
  brandColor?: string | null;
  createdAt?: number;
}

export interface MembershipItem {
  id: string;
  userId: string;
  role: 'super_admin' | 'brand_admin' | 'business_admin' | 'branch_manager' | 'review_executive' | 'finance_manager';
  brandId?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  status: string;
  invitedEmail?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

interface HierarchyContextValue {
  currentLevel: HierarchyLevel;
  setLevel: (level: HierarchyLevel) => void;
  activeBrand: BrandItem | null;
  activeBusiness: BusinessItem | null;
  activeBranch: BranchItem | null;
  brands: BrandItem[];
  businesses: BusinessItem[];
  branches: BranchItem[];
  memberships: MembershipItem[];
  roles: {
    isSuperAdmin: boolean;
    hasBrandAccess: boolean;
    hasBusinessAccess: boolean;
    hasBranchAccess: boolean;
  };
  isLoading: boolean;
  selectBrand: (id: string) => void;
  selectBusiness: (id: string) => void;
  selectBranch: (id: string) => void;
  refreshHierarchy: () => Promise<void>;
}

const HierarchyContext = createContext<HierarchyContextValue | null>(null);

const STORAGE_LEVEL_KEY = 'reviewqr_hierarchy_level';
const STORAGE_BRAND_ID = 'reviewqr_active_brand_id';
const STORAGE_BIZ_ID = 'reviewqr_active_business_id';
const STORAGE_BRANCH_ID = 'reviewqr_active_branch_id';

export function HierarchyProvider({ children }: { children: React.ReactNode }) {
  const [currentLevel, setCurrentLevelState] = useState<HierarchyLevel>(() => {
    if (typeof window === 'undefined') return 'branch';
    const saved = localStorage.getItem(STORAGE_LEVEL_KEY);
    return (saved === 'brand' || saved === 'business' || saved === 'branch') ? saved : 'branch';
  });

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [roles, setRoles] = useState({
    isSuperAdmin: false,
    hasBrandAccess: true,
    hasBusinessAccess: true,
    hasBranchAccess: true
  });
  const [isLoading, setIsLoading] = useState(true);

  const [activeBrandId, setActiveBrandId] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem(STORAGE_BRAND_ID)) || '';
  });

  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem(STORAGE_BIZ_ID)) || '';
  });

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem(STORAGE_BRANCH_ID)) || '';
  });

  const setLevel = (lvl: HierarchyLevel) => {
    setCurrentLevelState(lvl);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_LEVEL_KEY, lvl);
    }
  };

  const selectBrand = (id: string) => {
    setActiveBrandId(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BRAND_ID, id);

    // Also pick first business in this brand
    const firstBiz = businesses.find((b) => b.brandId === id) || businesses[0];
    if (firstBiz) {
      selectBusiness(firstBiz.id);
    }
  };

  const selectBusiness = (id: string) => {
    setActiveBusinessId(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BIZ_ID, id);

    // Also pick first branch in this business
    const firstBranch = branches.find((br) => br.businessId === id) || branches[0];
    if (firstBranch) {
      setActiveBranchId(firstBranch.id);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BRANCH_ID, firstBranch.id);
    }
  };

  const selectBranch = (id: string) => {
    setActiveBranchId(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BRANCH_ID, id);

    const br = branches.find((b) => b.id === id);
    if (br && br.businessId !== activeBusinessId) {
      setActiveBusinessId(br.businessId);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BIZ_ID, br.businessId);
    }
  };

  const refreshHierarchy = useCallback(async () => {
    try {
      const data = await apiFetch<{
        success: boolean;
        brands: BrandItem[];
        businesses: BusinessItem[];
        branches: BranchItem[];
        memberships: MembershipItem[];
        roles: any;
      }>('/api/hierarchy');

      if (data?.success) {
        setBrands(data.brands || []);
        setBusinesses(data.businesses || []);
        setBranches(data.branches || []);
        setMemberships(data.memberships || []);
        if (data.roles) setRoles(data.roles);

        // Auto-select valid Brand
        if (data.brands?.length > 0) {
          setActiveBrandId((curr) => {
            const exists = data.brands.some((b) => b.id === curr);
            const next = exists ? curr : data.brands[0].id;
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BRAND_ID, next);
            return next;
          });
        }

        // Auto-select valid Business
        if (data.businesses?.length > 0) {
          setActiveBusinessId((curr) => {
            const exists = data.businesses.some((b) => b.id === curr);
            const next = exists ? curr : data.businesses[0].id;
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BIZ_ID, next);
            return next;
          });
        }

        // Auto-select valid Branch
        if (data.branches?.length > 0) {
          setActiveBranchId((curr) => {
            const exists = data.branches.some((b) => b.id === curr);
            const next = exists ? curr : data.branches[0].id;
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_BRANCH_ID, next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('Could not load hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHierarchy();
  }, [refreshHierarchy]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0] || null;
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0] || null;
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || null;

  return (
    <HierarchyContext.Provider
      value={{
        currentLevel,
        setLevel,
        activeBrand,
        activeBusiness,
        activeBranch,
        brands,
        businesses,
        branches,
        memberships,
        roles,
        isLoading,
        selectBrand,
        selectBusiness,
        selectBranch,
        refreshHierarchy
      }}
    >
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (!context) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}
