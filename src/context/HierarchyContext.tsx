import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export type HierarchyLevel = 'brand' | 'business' | 'branch';
export type EntityMode = 'single' | 'multi';

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
  entityMode: EntityMode;
  isSingleMode: boolean;
  setEntityMode: (mode: EntityMode) => void;
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
  upgradeToMultiBranch: (
    brandName: string,
    secondBranch: {
      name: string;
      address?: string;
      city?: string;
      phone?: string;
      googlePlaceId?: string;
      googleReviewUrl?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
}

const HierarchyContext = createContext<HierarchyContextValue | null>(null);

const STORAGE_LEVEL_KEY = 'reviewqr_hierarchy_level';
const STORAGE_ENTITY_MODE = 'reviewqr_entity_mode';
const STORAGE_BRAND_ID = 'reviewqr_active_brand_id';
const STORAGE_BIZ_ID = 'reviewqr_active_business_id';
const STORAGE_BRANCH_ID = 'reviewqr_active_branch_id';

export function HierarchyProvider({ children }: { children: React.ReactNode }) {
  const [currentLevel, setCurrentLevelState] = useState<HierarchyLevel>(() => {
    if (typeof window === 'undefined') return 'branch';
    const saved = localStorage.getItem(STORAGE_LEVEL_KEY);
    return (saved === 'brand' || saved === 'business' || saved === 'branch') ? saved : 'branch';
  });

  const [entityMode, setEntityModeState] = useState<EntityMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_ENTITY_MODE) as EntityMode;
      if (saved === 'single' || saved === 'multi') return saved;
    }
    return 'single';
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

  const setEntityMode = (mode: EntityMode) => {
    setEntityModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ENTITY_MODE, mode);
    }
  };

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

  // Single Mode is active if entityMode is 'single' and user does not have multiple branches/brands
  const isSingleMode = entityMode === 'single' && branches.length <= 1 && brands.length <= 1;

  const upgradeToMultiBranch = async (
    brandName: string,
    secondBranch: {
      name: string;
      address?: string;
      city?: string;
      phone?: string;
      googlePlaceId?: string;
      googleReviewUrl?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!activeBusiness?.id) {
        return { success: false, error: 'No active store selected to upgrade.' };
      }

      // 1. Create or use existing Brand
      let targetBrandId = activeBusiness.brandId || activeBrand?.id;
      if (!targetBrandId || brands.length === 0) {
        const brandRes = await apiFetch<{ success: boolean; brand?: any; error?: string }>('/api/hierarchy/brands', {
          method: 'POST',
          body: JSON.stringify({ name: brandName.trim() || activeBusiness.name })
        });
        if (brandRes?.brand?.id) {
          targetBrandId = brandRes.brand.id;
        }
      }

      // 2. Link activeBusiness to brand
      if (targetBrandId) {
        await apiFetch(`/api/businesses/${activeBusiness.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ brandId: targetBrandId, businessType: 'company_owned' })
        }).catch((err) => console.warn('Brand link notice:', err));
      }

      // 3. Ensure Primary (Main Branch) location exists for activeBusiness
      const existingLocs = branches.filter((b) => b.businessId === activeBusiness.id);
      if (existingLocs.length === 0) {
        await apiFetch(`/api/businesses/${activeBusiness.id}/locations`, {
          method: 'POST',
          body: JSON.stringify({
            name: `${activeBusiness.name} (Main Branch)`,
            address: activeBusiness.address || null,
            city: activeBusiness.city || 'India',
            phone: activeBusiness.phone || null,
            googlePlaceId: activeBusiness.googlePlaceId || null,
            googleReviewUrl: activeBusiness.googleReviewUrl || null,
            isPrimary: true
          })
        }).catch((locErr) => console.warn('Auto primary branch note:', locErr));
      }

      // 4. Add 2nd branch location
      await apiFetch(`/api/businesses/${activeBusiness.id}/locations`, {
        method: 'POST',
        body: JSON.stringify({
          name: secondBranch.name.trim(),
          address: secondBranch.address?.trim() || null,
          city: secondBranch.city?.trim() || activeBusiness.city || 'India',
          phone: secondBranch.phone?.trim() || null,
          googlePlaceId: secondBranch.googlePlaceId?.trim() || null,
          googleReviewUrl: secondBranch.googleReviewUrl?.trim() || activeBusiness.googleReviewUrl,
          isPrimary: false
        })
      });

      // 5. Update mode to multi and refresh hierarchy
      setEntityMode('multi');
      await refreshHierarchy();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to upgrade to multi-branch:', err);
      return { success: false, error: err?.message || 'Failed to upgrade. Please check details and try again.' };
    }
  };

  return (
    <HierarchyContext.Provider
      value={{
        currentLevel,
        setLevel,
        entityMode,
        isSingleMode,
        setEntityMode,
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
        refreshHierarchy,
        upgradeToMultiBranch
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
