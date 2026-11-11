import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Send,
  Trash2,
  FileText,
  Filter,
  DollarSign,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { TablePagination } from './TablePagination';
import { PlanItem } from './CrmPlansTab';

export interface LeadActivity {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  type: string;
}

export interface LeadItem {
  id: string;
  company: string;
  contactPerson: string;
  mobile: string;
  email: string;
  locations: number;
  quantity: string;
  product: string;
  message?: string | null;
  status: string;
  stage?: string;
  source?: string;
  assignedTo?: string | null;
  followUpDate?: string | null;
  followUpStatus?: string;
  dealValue?: number;
  activityLog?: string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface CrmLeadsTabProps {
  leads: LeadItem[];
  executives: string[];
  plans?: PlanItem[];
  onRefresh: () => Promise<void>;
  showNotice: (text: string, type?: 'success' | 'error') => void;
  onLeadConverted?: (customerId: string) => void;
}

export const CrmLeadsTab: React.FC<CrmLeadsTabProps> = ({
  leads,
  executives,
  plans = [],
  onRefresh,
  showNotice,
  onLeadConverted
}) => {
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedExecutive, setSelectedExecutive] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Convert Lead Modal state
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [selectedConvertPlanName, setSelectedConvertPlanName] = useState('Growth (NFC + Review Sync)');
  const [selectedConvertPlanId, setSelectedConvertPlanId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Selected lead for detail/notes slideover
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // New Lead Modal state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    company: '',
    contactPerson: '',
    mobile: '',
    email: '',
    locations: 1,
    product: 'NFC + QR Smart Review Standee',
    source: 'direct_call',
    stage: 'new',
    assignedTo: executives[0] || 'Unassigned',
    followUpDate: '',
    dealValue: 999,
    message: ''
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const STAGES = [
    { id: 'new', label: 'New Lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'contacted', label: 'Contacted', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'followup', label: 'Follow-up Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'proposal', label: 'Proposal Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'won', label: 'Won / Converted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'lost', label: 'Lost / Closed', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  ];

  const SOURCES = [
    { id: 'landing_page', label: 'Landing Page Form' },
    { id: 'whatsapp', label: 'WhatsApp Inquiry' },
    { id: 'direct_call', label: 'Phone Call / Direct' },
    { id: 'referral', label: 'Referral' },
    { id: 'ads', label: 'Social / Google Ads' }
  ];

  // Helper for follow-up status check
  const getFollowUpStatus = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr).getTime();
    if (isNaN(targetDate)) return null;
    const now = Date.now();
    const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
    if (isToday) return { type: 'today', label: 'Follow-up Today!' };
    if (targetDate < now) return { type: 'overdue', label: 'Overdue Follow-up' };
    return { type: 'upcoming', label: `Follow-up: ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` };
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lead.company.toLowerCase().includes(q) ||
      lead.contactPerson.toLowerCase().includes(q) ||
      lead.mobile.includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.product.toLowerCase().includes(q);

    const leadStage = lead.stage || lead.status || 'new';
    const matchesStage = selectedStage === 'all' || leadStage === selectedStage;
    const matchesSource = selectedSource === 'all' || (lead.source || 'landing_page') === selectedSource;
    const matchesExec = selectedExecutive === 'all' || lead.assignedTo === selectedExecutive;

    return matchesSearch && matchesStage && matchesSource && matchesExec;
  });

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStage, selectedSource, selectedExecutive, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  // Today & Overdue count
  const todayFollowUps = leads.filter((l) => getFollowUpStatus(l.followUpDate)?.type === 'today');
  const overdueFollowUps = leads.filter((l) => getFollowUpStatus(l.followUpDate)?.type === 'overdue');

  // Update Stage handler
  const handleUpdateStage = async (leadId: string, stage: string) => {
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage })
      });
      showNotice(`Lead stage updated to ${stage.toUpperCase()}`);
      if (activeLead && activeLead.id === leadId) {
        setActiveLead({ ...activeLead, stage, status: stage });
      }
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update stage', 'error');
    }
  };

  // Assign lead handler
  const handleAssignLead = async (leadId: string, assignedTo: string) => {
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo })
      });
      showNotice(`Lead assigned to ${assignedTo}`);
      if (activeLead && activeLead.id === leadId) {
        setActiveLead({ ...activeLead, assignedTo });
      }
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to assign lead', 'error');
    }
  };

  // Update follow-up date
  const handleUpdateFollowUp = async (leadId: string, followUpDate: string) => {
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ followUpDate })
      });
      showNotice('Follow-up schedule updated');
      if (activeLead && activeLead.id === leadId) {
        setActiveLead({ ...activeLead, followUpDate });
      }
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update follow-up', 'error');
    }
  };

  // Add conversation note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await apiFetch<{ success: boolean; activity: LeadActivity }>(
        `/api/admin/crm/leads/${activeLead.id}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({ text: newNoteText, type: 'note' })
        }
      );
      showNotice('Conversation note added!');
      setNewNoteText('');
      
      let activities = [];
      try {
        activities = activeLead.activityLog ? JSON.parse(activeLead.activityLog) : [];
      } catch {}
      activities.unshift(res.activity);
      setActiveLead({ ...activeLead, activityLog: JSON.stringify(activities) });
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to save note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Create manual lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.company || !newLeadForm.mobile) {
      showNotice('Company name and mobile number are required', 'error');
      return;
    }
    setIsSubmittingLead(true);
    try {
      await apiFetch('/api/admin/crm/leads', {
        method: 'POST',
        body: JSON.stringify(newLeadForm)
      });
      showNotice('New lead added to CRM pipeline!');
      setIsAddLeadOpen(false);
      setNewLeadForm({
        company: '',
        contactPerson: '',
        mobile: '',
        email: '',
        locations: 1,
        product: 'NFC + QR Smart Review Standee',
        source: 'direct_call',
        stage: 'new',
        assignedTo: executives[0] || 'Unassigned',
        followUpDate: '',
        dealValue: 999,
        message: ''
      });
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to create lead', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, { method: 'DELETE' });
      showNotice('Lead deleted successfully');
      if (activeLead?.id === leadId) setActiveLead(null);
      await onRefresh();
    } catch (err: any) {
      showNotice(err?.message || 'Failed to delete lead', 'error');
    }
  };

  // Open Convert Lead Modal
  const openConvertModal = (lead: LeadItem) => {
    setConvertingLead(lead);
    if (plans && plans.length > 0) {
      const match = plans.find((p) => p.name.toLowerCase().includes('growth')) || plans[0];
      setSelectedConvertPlanId(match.id);
      setSelectedConvertPlanName(match.name);
    } else {
      setSelectedConvertPlanId(null);
      setSelectedConvertPlanName('Growth (NFC + Review Sync)');
    }
  };

  // Convert lead to Customer 360
  const handleConvertLead = async () => {
    if (!convertingLead) return;
    setIsConverting(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; customer: any; generatedPassword?: string }>(
        `/api/admin/crm/leads/${convertingLead.id}/convert`,
        {
          method: 'POST',
          body: JSON.stringify({
            planId: selectedConvertPlanId,
            planName: selectedConvertPlanName
          })
        }
      );
      showNotice(res.message || `${convertingLead.company} successfully converted to Customer!`);
      const convertedId = res.customer?.id || convertingLead.id;
      setConvertingLead(null);
      if (activeLead?.id === convertingLead.id) {
        setActiveLead(null);
      }
      await onRefresh();
      if (onLeadConverted) {
        onLeadConverted(convertedId);
      }
    } catch (err: any) {
      showNotice(err?.message || 'Failed to convert lead to customer', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // Parse activities safely
  const getActivities = (lead: LeadItem): LeadActivity[] => {
    try {
      return lead.activityLog ? JSON.parse(lead.activityLog) : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* Follow-up Alert Banner */}
      {(todayFollowUps.length > 0 || overdueFollowUps.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {todayFollowUps.length > 0 && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-amber-900 text-xs shadow-xs">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{todayFollowUps.length} Follow-ups Scheduled for Today!</p>
                <p className="text-amber-700">Check with your assigned executives and update conversation notes.</p>
              </div>
            </div>
          )}
          {overdueFollowUps.length > 0 && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300/60 text-rose-900 text-xs shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{overdueFollowUps.length} Overdue Follow-ups Require Attention!</p>
                <p className="text-rose-700">Client follow-up dates have passed without status updates.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by company, person, phone, email, product..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            aria-label="Filter by Lead Stage"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Stages ({leads.length})</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({leads.filter((l) => (l.stage || l.status) === s.id).length})
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            aria-label="Filter by Lead Source"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Executive Filter */}
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            aria-label="Filter by Assigned Executive"
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Executives</option>
            {executives.map((ex) => (
              <option key={ex} value={ex}>
                Assigned: {ex}
              </option>
            ))}
          </select>

          {/* Add Lead Button */}
          <Button
            size="sm"
            onClick={() => setIsAddLeadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-3.5 text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-full">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 w-[28%]">Lead & Contact</th>
                <th className="py-2.5 px-3 w-[22%]">Pipeline & Assigned</th>
                <th className="py-2.5 px-3 w-[24%]">Requirement & Follow-Up</th>
                <th className="py-2.5 px-3 w-[10%]">Source & Date</th>
                <th className="py-2.5 px-3 text-right w-[16%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No CRM leads found matching your criteria</p>
                    <p className="text-[11px] text-slate-400">Inquiries submitted from your landing page automatically show up here.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const leadStage = lead.stage || lead.status || 'new';
                  const stageObj = STAGES.find((s) => s.id === leadStage) || STAGES[0];
                  const followUp = getFollowUpStatus(lead.followUpDate);
                  const activities = getActivities(lead);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setActiveLead(lead)}
                    >
                      {/* Lead & Contact */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                          {lead.company}
                        </div>
                        <div className="text-slate-600 font-medium text-xs mt-0.5">
                          {lead.contactPerson}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>{lead.mobile}</span>
                          <span>•</span>
                          <span className="truncate max-w-[130px]">{lead.email}</span>
                        </div>
                      </td>

                      {/* Pipeline & Assigned */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={leadStage}
                          onChange={(e) => handleUpdateStage(lead.id, e.target.value)}
                          aria-label="Change lead stage"
                          className={`text-xs font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer w-full max-w-[160px] ${stageObj.color}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0">By:</span>
                          <select
                            value={lead.assignedTo || 'Unassigned'}
                            onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                            aria-label="Assign to team member"
                            className="text-[11px] font-semibold rounded-md px-1.5 py-0.5 border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 cursor-pointer w-full max-w-[140px]"
                          >
                            <option value="Unassigned">Unassigned</option>
                            {executives.map((ex) => (
                              <option key={ex} value={ex}>
                                {ex}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Requirement & Follow-Up */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">{lead.product}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="text-emerald-700 font-bold font-mono">₹{(lead.dealValue || 999).toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span>Qty: {lead.quantity} ({lead.locations} loc)</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <input
                            type="date"
                            value={lead.followUpDate ? lead.followUpDate.substring(0, 10) : ''}
                            onChange={(e) => handleUpdateFollowUp(lead.id, e.target.value)}
                            aria-label="Schedule follow-up date"
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 shadow-2xs focus:ring-1 focus:ring-blue-500"
                          />
                          {followUp && (
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                followUp.type === 'today'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                  : followUp.type === 'overdue'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {followUp.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source & Date */}
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold text-slate-600 bg-slate-50 px-1.5 py-0">
                          {lead.source?.replace('_', ' ') || 'landing'}
                        </Badge>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {new Date(lead.createdAt * (lead.createdAt < 10000000000 ? 1000 : 1)).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConvertModal(lead)}
                            className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Convert Lead to Customer 360"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Convert</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveLead(lead)}
                            className="h-7 px-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title="View Conversation Timeline"
                          >
                            <FileText className="w-3 h-3 mr-0.5" />
                            Notes ({activities.length})
                          </Button>
                          {lead.mobile && (
                            <a
                              href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.contactPerson}, thank you for contacting Loctimize regarding ${lead.product}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                              title="WhatsApp Lead"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3 h-3" />
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
          totalItems={filteredLeads.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          colorScheme="blue"
        />
      </div>

      {/* Lead Conversation Tracking Slide-Over / Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center sm:justify-end p-0 sm:p-4">
          <div className="bg-white h-full sm:h-auto sm:max-h-[90vh] w-full sm:max-w-xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Lead Details & Activity History
                </span>
                <h2 className="text-xl font-black mt-1 text-white">{activeLead.company}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Contact: <span className="font-semibold text-white">{activeLead.contactPerson}</span> ({activeLead.mobile})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const leadToConvert = activeLead;
                    setActiveLead(null);
                    openConvertModal(leadToConvert);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Convert to Customer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveLead(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Lead Status & Attributes Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stage</span>
                <span className="font-bold text-blue-700 capitalize">{activeLead.stage || activeLead.status}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Executive</span>
                <span className="font-bold text-slate-800">{activeLead.assignedTo || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Deal</span>
                <span className="font-bold font-mono text-emerald-700">₹{(activeLead.dealValue || 999).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Locations</span>
                <span className="font-bold text-slate-800">{activeLead.locations} Outlets</span>
              </div>
            </div>

            {/* Conversation Log & Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Conversation Notes & Tracking Timeline
              </h3>

              {getActivities(activeLead).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No conversation notes logged yet. Add your first call or chat summary below.
                </div>
              ) : (
                <div className="space-y-3">
                  {getActivities(activeLead).map((act) => (
                    <div key={act.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          {act.author}
                        </span>
                        <span className="font-mono">
                          {new Date(act.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium whitespace-pre-wrap">{act.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Log client call details, negotiation, or WhatsApp summary..."
                  className="text-xs h-10 flex-1 border-slate-200 focus-visible:ring-blue-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Add New CRM Lead</h3>
                <p className="text-xs text-slate-400">Record a phone call, walk-in, or offline prospect</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddLeadOpen(false)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Brand Name *</label>
                  <Input
                    required
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    placeholder="e.g. Royal Sweets & Bakery"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                  <Input
                    value={newLeadForm.contactPerson}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile / WhatsApp Number *</label>
                  <Input
                    required
                    value={newLeadForm.mobile}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contact@business.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Source</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    aria-label="New lead source"
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Lead To</label>
                  <select
                    value={newLeadForm.assignedTo}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, assignedTo: e.target.value })}
                    aria-label="Assign new lead to team member"
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {executives.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deal Value (₹)</label>
                  <Input
                    type="number"
                    value={newLeadForm.dealValue}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, dealValue: Number(e.target.value) })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Schedule Follow-Up Date & Time</label>
                <input
                  type="datetime-local"
                  value={newLeadForm.followUpDate}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, followUpDate: e.target.value })}
                  aria-label="New lead follow-up date and time"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddLeadOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingLead}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmittingLead ? 'Saving...' : 'Add Lead to CRM'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Customer Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Lead Conversion
                </span>
                <h3 className="text-lg font-black text-white">Convert to Customer 360</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Provision merchant account & add directly to Customer 360
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConvertingLead(null)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Lead Summary Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{convertingLead.company}</h4>
                    <p className="text-slate-500 font-medium">{convertingLead.contactPerson} • {convertingLead.mobile}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold border-emerald-300">
                    {convertingLead.locations} Outlets
                  </Badge>
                </div>
                {convertingLead.email && (
                  <p className="text-slate-500 text-[11px] font-mono">Email: {convertingLead.email}</p>
                )}
                {convertingLead.product && (
                  <p className="text-slate-500 text-[11px]">Product: <span className="font-semibold text-slate-700">{convertingLead.product}</span></p>
                )}
              </div>

              {/* Subscription Plan Selection */}
              <div>
                <label className="font-black text-slate-800 block mb-1.5 uppercase text-[11px] tracking-wider">
                  Assign Customer Plan & Pricing Tier
                </label>
                <select
                  value={selectedConvertPlanId || selectedConvertPlanName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = plans.find((p) => p.id === val || p.name === val);
                    if (matched) {
                      setSelectedConvertPlanId(matched.id);
                      setSelectedConvertPlanName(matched.name);
                    } else {
                      setSelectedConvertPlanId(null);
                      setSelectedConvertPlanName(val);
                    }
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-emerald-500"
                >
                  {plans && plans.length > 0 ? (
                    plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price.toLocaleString('en-IN')} / {p.billingPeriod} (Max {p.maxLocations} Locations)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Starter">Starter - ₹0 / Lifetime (1 Location)</option>
                      <option value="Growth (NFC + Review Sync)">Growth (NFC + Review Sync) - ₹999 / year (3 Locations)</option>
                      <option value="Enterprise (Multi-Outlet)">Enterprise (Multi-Outlet) - ₹2,999 / year (10 Locations)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can also upgrade or downgrade the customer's plan at any time from Customer 360.
                </p>
              </div>

              {/* Conversion Benefits Callout */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  What happens upon conversion:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-emerald-800 font-medium">
                  <li>Creates an active merchant account and store outlet profile.</li>
                  <li>Assigns the chosen subscription plan with full platform features.</li>
                  <li>Updates this lead stage to Won / Converted in CRM.</li>
                  <li>Immediately appears in Customer 360 and Billing directory.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertingLead(null)}
                  disabled={isConverting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConvertLead}
                  disabled={isConverting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm px-4"
                >
                  <UserCheck className="w-4 h-4" />
                  {isConverting ? 'Converting to Customer...' : 'Confirm & Convert to Customer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

