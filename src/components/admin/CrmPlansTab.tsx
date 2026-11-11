import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  Zap,
  Building,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { TablePagination } from './TablePagination';

export interface PlanItem {
  id: string;
  name: string;
  badge?: string | null;
  price: number;
  billingPeriod: string;
  maxLocations: number;
  featuresJson: string;
  isActive: number;
  createdAt: number;
  updatedAt: number;
}

interface CrmPlansTabProps {
  plans: PlanItem[];
  onRefresh: () => Promise<void>;
  showNotice: (text: string, type?: 'success' | 'error') => void;
}

export const CrmPlansTab: React.FC<CrmPlansTabProps> = ({
  plans,
  onRefresh,
  showNotice
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formPrice, setFormPrice] = useState(999);
  const [formPeriod, setFormPeriod] = useState('monthly');
  const [formMaxLocations, setFormMaxLocations] = useState(1);
  const [formFeaturesText, setFormFeaturesText] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingPlan(null);
    setFormName('');
    setFormBadge('');
    setFormPrice(999);
    setFormPeriod('monthly');
    setFormMaxLocations(1);
    setFormFeaturesText('1 NFC + QR Smart Acrylic Standee\nAI Review Auto-Draft\nWhatsApp Support');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormBadge(plan.badge || '');
    setFormPrice(plan.price);
    setFormPeriod(plan.billingPeriod || 'monthly');
    setFormMaxLocations(plan.maxLocations || 1);
    try {
      const parsed = JSON.parse(plan.featuresJson);
      setFormFeaturesText(Array.isArray(parsed) ? parsed.join('\n') : plan.featuresJson);
    } catch {
      setFormFeaturesText(plan.featuresJson || '');
    }
    setFormIsActive(plan.isActive === 1);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotice('Plan name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const featuresList = formFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlan) {
        // Edit existing
        await apiFetch(`/api/admin/crm/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName.trim(),
            badge: formBadge.trim() || null,
            price: Number(formPrice) || 0,
            billingPeriod: formPeriod,
            maxLocations: Number(formMaxLocations) || 1,
            features: featuresList,
            isActive: formIsActive ? 1 : 0
          })
        });
        showNotice(`Plan "${formName}" updated successfully!`);
      } else {
        // Create new
        await apiFetch('/api/admin/crm/plans', {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            badge: formBadge.trim() || null,
            price: Number(formPrice) || 0,
            billingPeriod: formPeriod,
            maxLocations: Number(formMaxLocations) || 1,
            features: featuresList,
            isActive: formIsActive ? 1 : 0
          })
        });
        showNotice(`New plan "${formName}" created successfully!`);
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to save plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: PlanItem) => {
    if (!confirm(`Are you sure you want to permanently delete plan "${plan.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/crm/plans/${plan.id}`, {
        method: 'DELETE'
      });
      showNotice(`Plan "${plan.name}" deleted successfully.`);
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to delete plan', 'error');
    }
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(plans.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedPlans = plans.slice(startIndex, startIndex + pageSize);

  const parseFeatures = (json: string): string[] => {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [json];
    } catch {
      return json ? [json] : [];
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Subscription & Product Plans ({plans.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage merchant subscription packages, standee bundles, and pricing tiers.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 text-xs gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Plan</span>
        </Button>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Plan Name & Badge</th>
                <th className="py-3 px-4">Pricing & Cycle</th>
                <th className="py-3 px-4 text-center">Max Outlets</th>
                <th className="py-3 px-4">Features Included</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No subscription plans found</p>
                    <p className="text-[11px] text-slate-400">Click &quot;Add New Plan&quot; to configure your first package tier.</p>
                  </td>
                </tr>
              ) : (
                paginatedPlans.map((plan) => {
                  const features = parseFeatures(plan.featuresJson);

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                          {plan.badge && (
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black border-none px-2 py-0.5">
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {plan.id}</span>
                      </td>

                      {/* Pricing & Cycle */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                          {plan.billingPeriod === 'one_time' ? 'One-Time Hardware' : plan.billingPeriod}
                        </div>
                      </td>

                      {/* Max Outlets */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                          {plan.maxLocations} {plan.maxLocations === 1 ? 'Location' : 'Locations'}
                        </span>
                      </td>

                      {/* Features */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {features.slice(0, 2).map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-slate-700 text-[11px] truncate">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                          {features.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold pl-5">
                              +{features.length - 2} more features
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            plan.isActive === 1
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {plan.isActive === 1 ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(plan)}
                            className="h-8 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 font-bold gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePlan(plan)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <TablePagination
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={plans.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          colorScheme="indigo"
        />
      </div>

      {/* Add / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingPlan ? 'Edit Plan Package' : 'Create New Subscription Plan'}
                </h3>
                <p className="text-xs text-slate-400">Configure pricing, limits, and customer features.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Plan Name *</label>
                <Input
                  required
                  placeholder="e.g. Growth (NFC + Review Sync)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 text-xs font-semibold rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Price (₹ INR) *</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    placeholder="2499"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Billing Period *</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One-Time Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Max Locations / Outlets *</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={formMaxLocations}
                    onChange={(e) => setFormMaxLocations(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tag / Badge (Optional)</label>
                  <Input
                    placeholder="e.g. Popular / Bestseller"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Features Checklist (1 per line)</label>
                  <span className="text-[10px] text-slate-400">Press enter for next feature</span>
                </div>
                <textarea
                  rows={4}
                  value={formFeaturesText}
                  onChange={(e) => setFormFeaturesText(e.target.value)}
                  placeholder="3 NFC + QR Smart Standees&#10;AI Multilingual Review Copilot&#10;Priority WhatsApp Support"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="planActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="planActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Plan is active and available for customer subscription & upgrades
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

