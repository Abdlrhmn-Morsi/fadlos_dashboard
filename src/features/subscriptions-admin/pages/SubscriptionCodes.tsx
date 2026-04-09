import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Ban,
  Eye,
  Search,
  X,
  Loader2,
  Sparkles,
  Users,
  Clock,
  ShieldX,
  Hash,
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import StatusModal from '../../../components/common/StatusModal';
import { Pagination } from '../../../components/common/Pagination';
import {
  generateSubscriptionCodes,
  getSubscriptionCodes,
  getSubscriptionCodeStats,
  getSubscriptionCodeUsages,
  revokeSubscriptionCode,
  SubscriptionCode,
  SubscriptionCodeStats,
  SubscriptionCodeUsage,
  CreateSubscriptionCodePayload,
} from '../api/subscription-codes.api';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  fully_used: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  revoked: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const PLAN_COLORS: Record<string, string> = {
  pro: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const SubscriptionCodes: React.FC = () => {
  const { t } = useTranslation(['subscriptions', 'common']);
  const { isRTL } = useLanguage();

  // State
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [stats, setStats] = useState<SubscriptionCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  // Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showUsagesModal, setShowUsagesModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<SubscriptionCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate form
  const [genPlan, setGenPlan] = useState<'pro' | 'premium'>('pro');
  const [genDuration, setGenDuration] = useState<1 | 3 | 6 | 12>(1);
  const [genMaxUses, setGenMaxUses] = useState(1);
  const [genQuantity, setGenQuantity] = useState(1);
  const [genNotes, setGenNotes] = useState('');
  const [genExpiresAt, setGenExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Usages
  const [usages, setUsages] = useState<SubscriptionCodeUsage[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);

  // Revoke
  const [revoking, setRevoking] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscriptionCodes({
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        plan: filterPlan !== 'all' ? filterPlan : undefined,
      });
      setCodes(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (e) {
      console.error('Failed to fetch codes', e);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterStatus, filterPlan]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getSubscriptionCodeStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
    fetchStats();
  }, [fetchCodes, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const payload: CreateSubscriptionCodePayload = {
        plan: genPlan,
        durationMonths: genDuration,
        maxUses: genMaxUses,
        quantity: genQuantity,
        notes: genNotes || undefined,
        expiresAt: genExpiresAt || undefined,
      };
      const res = await generateSubscriptionCodes(payload);
      setGeneratedCodes(res.data.map((c) => c.code));
      setShowGenerateModal(false);
      setShowResultModal(true);
      fetchCodes();
      fetchStats();
      // Reset form
      setGenPlan('pro');
      setGenDuration(1);
      setGenMaxUses(1);
      setGenQuantity(1);
      setGenNotes('');
      setGenExpiresAt('');
    } catch (e) {
      console.error('Failed to generate codes', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedCode) return;
    setRevoking(true);
    try {
      await revokeSubscriptionCode(selectedCode.id);
      setShowRevokeModal(false);
      setSelectedCode(null);
      fetchCodes();
      fetchStats();
    } catch (e) {
      console.error('Failed to revoke', e);
    } finally {
      setRevoking(false);
    }
  };

  const handleViewUsages = async (code: SubscriptionCode) => {
    setSelectedCode(code);
    setUsagesLoading(true);
    setShowUsagesModal(true);
    try {
      const res = await getSubscriptionCodeUsages(code.id, { page: 1, limit: 20 });
      setUsages(res.data);
    } catch (e) {
      console.error('Failed to fetch usages', e);
    } finally {
      setUsagesLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDurationLabel = (months: number) => {
    const key = `codes.duration_${months}`;
    return t(key, { defaultValue: `${months} Month(s)` });
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statCards = stats
    ? [
        { label: t('codes.stats.total'), value: stats.total, icon: Hash, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
        { label: t('codes.stats.active'), value: stats.active, icon: Sparkles, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: t('codes.stats.fullyUsed'), value: stats.fullyUsed, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: t('codes.stats.revoked'), value: stats.revoked, icon: ShieldX, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
      ]
    : [];

  return (
    <div className="list-page-container p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-light rounded-[4px] animate-float">
            <Ticket size={24} className="text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('codes.title')}
          </h2>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          {t('codes.generateCodes')}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div
              key={i}
              className={clsx(
                'rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-md',
                s.bg
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                </div>
                <s.icon size={24} className={clsx(s.color, 'opacity-60')} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className={clsx('absolute top-1/2 -translate-y-1/2 text-slate-400', isRTL ? 'right-3' : 'left-3')} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder={t('codes.searchPlaceholder')}
            className={clsx(
              'w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition',
              isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
            )}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition min-w-[140px]"
        >
          <option value="all">{t('codes.filterStatus')}: {t('codes.filterAll')}</option>
          <option value="active">{t('codes.status.active')}</option>
          <option value="fully_used">{t('codes.status.fully_used')}</option>
          <option value="expired">{t('codes.status.expired')}</option>
          <option value="revoked">{t('codes.status.revoked')}</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}
          className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition min-w-[140px]"
        >
          <option value="all">{t('codes.filterPlan')}: {t('codes.filterAll')}</option>
          <option value="pro">{t('plans.pro.name', { defaultValue: 'Pro' })}</option>
          <option value="premium">{t('plans.premium.name', { defaultValue: 'Premium' })}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-teal-500" size={32} />
          </div>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Ticket size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t('codes.noCodes')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('codes.noCodesDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                  <th className="table-header-cell">{t('codes.table.code')}</th>
                  <th className="table-header-cell">{t('codes.table.plan')}</th>
                  <th className="table-header-cell">{t('codes.table.duration')}</th>
                  <th className="table-header-cell">{t('codes.table.usage')}</th>
                  <th className="table-header-cell">{t('codes.table.status')}</th>
                  <th className="table-header-cell">{t('codes.table.expires')}</th>
                  <th className="table-header-cell">{t('codes.table.createdAt')}</th>
                  <th className={clsx("table-header-cell", isRTL ? "text-right" : "text-end")}>{t('codes.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {codes.map((code) => {
                  const usagePercent = code.maxUses > 0 ? (code.usedCount / code.maxUses) * 100 : 0;
                  return (
                    <tr key={code.id} className="table-row group">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-[4px]">
                            {code.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(code.code, code.id)}
                            className="p-2 text-slate-300 hover:text-primary hover:bg-primary-light rounded-[4px] transition-all"
                            title={t('codes.actions.copy')}
                          >
                            {copiedId === code.id ? (
                              <Check size={16} className="text-emerald-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={clsx('px-3 py-1 rounded-[4px] text-[0.625rem] font-extrabold uppercase tracking-wider', PLAN_COLORS[code.plan] || 'bg-slate-100 text-slate-600')}>
                          {code.plan === 'pro' ? t('plans.pro.name', { defaultValue: 'Pro' }) : t('plans.premium.name', { defaultValue: 'Premium' })}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock size={16} className="opacity-50" />
                          <span className="text-sm font-bold">{getDurationLabel(code.durationMonths)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full transition-all',
                                usagePercent >= 100 ? 'bg-blue-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-primary'
                              )}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {code.usedCount}/{code.maxUses}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={clsx('px-3 py-1 rounded-[4px] text-[0.625rem] font-extrabold uppercase tracking-widest', STATUS_COLORS[code.status] || '')}>
                          {t(`codes.status.${code.status}`, { defaultValue: code.status })}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {formatDate(code.expiresAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-xs font-bold text-slate-400">
                          {formatDate(code.createdAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className={clsx("flex items-center gap-2 justify-end")}>
                          {code.usedCount > 0 && (
                            <button
                              onClick={() => handleViewUsages(code)}
                              className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-[4px] transition-all active:scale-90"
                              title={t('codes.actions.viewUsages')}
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {code.status === 'active' && (
                            <button
                              onClick={() => { setSelectedCode(code); setShowRevokeModal(true); }}
                              className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-all active:scale-90"
                              title={t('codes.actions.revoke')}
                            >
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={loading}
        />
      </div>

      {/* ======================== */}
      {/* GENERATE MODAL */}
      {/* ======================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('codes.generateTitle')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('codes.generateDescription')}</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Plan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.plan')}</label>
                <select
                  value={genPlan}
                  onChange={(e) => setGenPlan(e.target.value as 'pro' | 'premium')}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="pro">{t('plans.pro.name', { defaultValue: 'Pro' })}</option>
                  <option value="premium">{t('plans.premium.name', { defaultValue: 'Premium' })}</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.duration')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 3, 6, 12] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setGenDuration(d)}
                      className={clsx(
                        'py-2 px-3 rounded-lg text-xs font-semibold border transition-all',
                        genDuration === d
                          ? 'border-primary bg-primary-light/10 text-primary ring-2 ring-primary/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      )}
                    >
                      {getDurationLabel(d)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.maxUses')}</label>
                <input
                  type="number"
                  min={1}
                  value={genMaxUses}
                  onChange={(e) => setGenMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                <p className="text-xs text-slate-400 mt-1">{t('codes.maxUsesHint')}</p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.quantity')}</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={genQuantity}
                  onChange={(e) => setGenQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                <p className="text-xs text-slate-400 mt-1">{t('codes.quantityHint')}</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.notes')}</label>
                <textarea
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  placeholder={t('codes.notesPlaceholder')}
                  rows={2}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('codes.expiresAt')}</label>
                <input
                  type="date"
                  value={genExpiresAt}
                  onChange={(e) => setGenExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                <p className="text-xs text-slate-400 mt-1">{t('codes.expiresAtHint')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700/60 flex gap-3 justify-end">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                {generating ? t('codes.generating') : t('codes.generate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* GENERATED CODES RESULT MODAL */}
      {/* ======================== */}
      {showResultModal && generatedCodes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('codes.generatedCodes')}</h2>
              </div>
              <button
                onClick={copyAllCodes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copiedId === 'all' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedId === 'all' ? t('codes.copiedAll') : t('codes.copyAll')}
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-[400px] overflow-y-auto">
              {generatedCodes.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/40">
                  <code className="font-mono text-sm font-bold text-slate-900 dark:text-white">{c}</code>
                  <button
                    onClick={() => copyToClipboard(c, `gen-${i}`)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copiedId === `gen-${i}` ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => { setShowResultModal(false); setGeneratedCodes([]); }}
                className="px-5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('codes.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* USAGES MODAL */}
      {/* ======================== */}
      {showUsagesModal && selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('codes.usagesTitle')}</h2>
                <code className="text-xs font-mono text-slate-500 mt-0.5">{selectedCode.code}</code>
              </div>
              <button onClick={() => { setShowUsagesModal(false); setSelectedCode(null); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {usagesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-teal-500" size={24} />
                </div>
              ) : usages.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">{t('codes.usagesEmpty')}</p>
              ) : (
                <div className="space-y-2">
                  {usages.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                          {u.store?.name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{isRTL ? (u.store?.nameAr || u.store?.name) : u.store?.name}</p>
                          <p className="text-xs text-slate-400">{t('codes.usagesStore')}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(u.redeemedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* REVOKE CONFIRMATION */}
      {/* ======================== */}
      <StatusModal
        isOpen={showRevokeModal}
        onClose={() => { setShowRevokeModal(false); setSelectedCode(null); }}
        type="confirm"
        title={t('codes.revokeConfirmTitle')}
        message={t('codes.revokeConfirmMessage')}
        onConfirm={handleRevoke}
        confirmText={t('codes.revokeConfirm')}
        isLoading={revoking}
      />
    </div>
  );
};

export default SubscriptionCodes;
