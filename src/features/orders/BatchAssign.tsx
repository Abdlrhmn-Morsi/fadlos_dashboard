import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { 
  Truck, 
  ChevronRight, 
  ChevronLeft,
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MapPin,
  Clock,
  Package,
  ArrowRight,
  ArrowLeft,
  User,
  Check,
  ExternalLink
} from 'lucide-react';
import { toast } from '../../utils/toast';
import { ordersApi } from './api/orders.api';
import * as deliveryDriversApi from '../delivery/api/delivery-drivers.api';
import clsx from 'clsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderStatus } from '../../types/order-status';
import { Permissions } from '../../types/permissions';
import { UserRole } from '../../types/user-role';

type Order = any;
type StoreDeliveryDriver = any;

const BatchAssign: React.FC = () => {
  const { t } = useTranslation(['orders', 'common', 'dashboard']);
  const { isRTL } = useLanguage();
  const { hasPermission, user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [suggestedDriver, setSuggestedDriver] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, driverId: '', driverName: '' });
  const [statusConfirmModal, setStatusConfirmModal] = useState({ isOpen: false, orderId: '', status: '' });
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [townFilter, setTownFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderMeta, setOrderMeta] = useState<any>(null);

  // Driver Queue state
  const [driverSearch, setDriverSearch] = useState('');
  const [driverDebouncedSearch, setDriverDebouncedSearch] = useState('');
  const [driverPage, setDriverPage] = useState(1);
  const [driverMeta, setDriverMeta] = useState<any>(null);
  const [driverTownFilter, setDriverTownFilter] = useState('');
  const [driverPlaceFilter, setDriverPlaceFilter] = useState('');

  // Debounce order search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setOrderPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce driver search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDriverDebouncedSearch(driverSearch);
      setDriverPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [driverSearch]);
  
  // Pre-select order if orderId is in URL
  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderIds([initialOrderId]);
    }
  }, [initialOrderId]);

  // Fetch data
  const fetchData = async (page = orderPage, dPage = driverPage) => {
    setLoading(true);
    try {
      // Fetch unassigned orders using dedicated batches endpoint
      const ordersRes: any = await ordersApi.getUnassignedBatches({ 
        page,
        limit: 10,
        orderNumber: debouncedSearch || undefined,
        customerName: debouncedSearch || undefined,
      });

      // Unwrap generic response or paginated response
      let data = [];
      let meta = null;
      
      if (ordersRes && ordersRes.data && Array.isArray(ordersRes.data)) {
        data = ordersRes.data;
        meta = ordersRes.meta;
      } else if (Array.isArray(ordersRes)) {
        data = ordersRes;
      }
      
      setOrders(data);
      setOrderMeta(meta);
      console.log(`[BatchAssign] Fetched ${data.length} orders`, { meta });

      // Fetch suggested driver and available drivers together
      const suggestedRes: any = await deliveryDriversApi.getSuggestedNextDriver({
        search: driverDebouncedSearch || undefined,
        page: dPage,
        limit: 10,
        townId: driverTownFilter || undefined,
        placeId: driverPlaceFilter || undefined,
      });
      
      const allDrivers = suggestedRes.queue || [];
      setAvailableDrivers(allDrivers);
      setDriverMeta(suggestedRes.meta);
      
      if (suggestedRes.suggestedDriverId) {
        setSuggestedDriver({ 
          id: suggestedRes.suggestedDriverId, 
          name: suggestedRes.suggestedDriverName,
          activeOrdersCount: 0
        });
      } else {
        setSuggestedDriver(null);
      }
    } catch (error) {
      console.error('Error fetching batch assignment data:', error);
      toast.error(t('common:error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = (e: React.MouseEvent, orderId: string, status: string) => {
    e.stopPropagation();
    if (updatingOrderIds.includes(orderId)) return;
    setStatusConfirmModal({ isOpen: true, orderId, status });
  };

  const executeStatusUpdate = async () => {
    const { orderId, status } = statusConfirmModal;
    if (!orderId || !status) return;

    setStatusConfirmModal(prev => ({ ...prev, isOpen: false }));
    setUpdatingOrderIds(prev => [...prev, orderId]);
    try {
      await ordersApi.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(t('orders:updateSuccess'));
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error(t('common:error_updating_status'));
    } finally {
      setUpdatingOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleBatchAssign = (driverId: string, driverName: string) => {
    if (selectedOrderIds.length === 0) {
      toast.error(t('orders:selectOrdersToDispatch'));
      return;
    }
    setConfirmModal({ isOpen: true, driverId, driverName });
  };

  const executeBatchAssign = async () => {
    const { driverId, driverName } = confirmModal;
    if (!driverId || !driverName) return;

    setConfirmModal({ ...confirmModal, isOpen: false });
    setDispatching(true);
    try {
      await ordersApi.batchAssignDriver(selectedOrderIds, driverId);
      
      toast.success(t('orders:batchAssignSuccess', { 
        count: selectedOrderIds.length,
        driverName: driverName
      }));
      
      // Clear selection and refresh
      setSelectedOrderIds([]);
      fetchData();
    } catch (error: any) {
      console.error('Batch assignment failed:', error);
      const errorMessage = error?.response?.data?.message || t('common:error_occurred');
      toast.error(errorMessage);
    } finally {
      setDispatching(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const address = typeof order.deliveryAddress === 'string' 
      ? (order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null)
      : order.deliveryAddress;
    
    // Safety check for parsed address
    if (!address && (townFilter || placeFilter)) return false;

    const townMatch = !townFilter || 
      address?.townEnName === townFilter || 
      address?.townArName === townFilter;
    
    const placeMatch = !placeFilter || 
      address?.placeEnName === placeFilter || 
      address?.placeArName === placeFilter;

    return !!(townMatch && placeMatch);
  });

  // Re-fetch when debounced search or page changes
  useEffect(() => {
    fetchData(orderPage, driverPage);
  }, [debouncedSearch, orderPage, driverDebouncedSearch, driverPage, driverTownFilter, driverPlaceFilter]);

  const handleNextPage = () => {
    if (orderMeta && orderPage < orderMeta.totalPages) {
      const next = orderPage + 1;
      setOrderPage(next);
      fetchData(next);
    }
  };

  const handlePrevPage = () => {
    if (orderPage > 1) {
      const prev = orderPage - 1;
      setOrderPage(prev);
      fetchData(prev);
    }
  };

  // Extract unique towns and places for filter suggestions
  const uniqueTowns = Array.from(new Set(orders.map(o => {
    const addr = typeof o.deliveryAddress === 'string' ? JSON.parse(o.deliveryAddress) : o.deliveryAddress;
    return isRTL ? addr?.townArName : addr?.townEnName;
  }).filter(Boolean)));

  const uniquePlaces = Array.from(new Set(orders.map(o => {
    const addr = typeof o.deliveryAddress === 'string' ? JSON.parse(o.deliveryAddress) : o.deliveryAddress;
    return isRTL ? addr?.placeArName : addr?.placeEnName;
  }).filter(Boolean)));

  if (loading && orders.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Truck className="text-primary w-8 h-8" />
            {t('orders:batchAssign')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            {t('orders:selectOrdersToDispatch')}
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-400">{orders.length} {t('orders:total')}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchData()}
            disabled={loading}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            <Clock className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-6 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-tight text-sm">
              {t('orders:confirmedForDelivery')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Orders */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {t('orders:unassignedOrders')}
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {filteredOrders.length}
                  </span>
                </h3>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {selectedOrderIds.length === filteredOrders.length ? t('common:deselect_all') : t('common:select_all')}
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('orders:searchOrders')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={townFilter}
                    onChange={(e) => setTownFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-primary/20 appearance-none capitalize"
                  >
                    <option value="">{t('orders:filterByTown')}</option>
                    {uniqueTowns.map(town => (
                      <option key={town} value={town}>{town}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={placeFilter}
                    onChange={(e) => setPlaceFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-primary/20 appearance-none capitalize"
                  >
                    <option value="">{t('orders:filterByPlace')}</option>
                    {uniquePlaces.map(place => (
                      <option key={place} value={place}>{place}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">{t('orders:noOrdersToDispatch')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map(order => {
                    const address = typeof order.deliveryAddress === 'string' ? JSON.parse(order.deliveryAddress) : order.deliveryAddress;
                    const isSelected = selectedOrderIds.includes(order.id);
                    
                    return (
                      <div 
                        key={order.id}
                        className={clsx(
                          "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group flex items-start gap-4",
                          isSelected && "bg-primary/5 dark:bg-primary/10"
                        )}
                        onClick={() => handleToggleOrder(order.id)}
                      >
                        <div className={clsx(
                          "w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-all",
                          isSelected 
                            ? "bg-primary border-primary text-white scale-110" 
                            : "border-slate-200 dark:border-slate-700 group-hover:border-primary"
                        )}>
                          {isSelected && <Check size={14} className="stroke-[4px]" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="text-primary">#{order.orderNumber || order.id.substring(0, 8)}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/orders/${order.id}`, '_blank');
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-primary"
                                title={t('orders:viewDetails')}
                              >
                                <ExternalLink size={12} />
                              </button>
                            </h3>
                            <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {t(`orders:statusDesc.${order.status.toLowerCase()}`)}
                            </span>
                          </div>
                          
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate mb-1">
                            {order.client?.name || order.clientInfo?.name || t('orders:guest')}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span className="truncate max-w-[150px]">
                                {address?.townEnName}, {address?.placeEnName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-primary">{order.totalAmount} {order.currency}</span>
                            </div>
                          </div>

                          {/* Order Progress Stepper */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-between relative px-1">
                              {[OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].map((status, index, array) => {
                                const statusesOrder = [
                                  OrderStatus.PENDING, 
                                  OrderStatus.CONFIRMED, 
                                  OrderStatus.PREPARING, 
                                  OrderStatus.READY,
                                  OrderStatus.DRIVER_ASSIGNED,
                                  OrderStatus.OUT_FOR_DELIVERY,
                                  OrderStatus.DELIVERED
                                ];
                                
                                const currentIndex = statusesOrder.indexOf(order.status);
                                const targetIndex = statusesOrder.indexOf(status);
                                
                                const isCompleted = currentIndex >= targetIndex;
                                const isCurrent = order.status === status;
                                const isNext = currentIndex === targetIndex - 1;
                                const isClickable = isNext && hasPermission(Permissions.ORDERS_UPDATE);
                                const isUpdating = updatingOrderIds.includes(order.id);

                                return (
                                  <React.Fragment key={status}>
                                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                                      <button
                                        onClick={(e) => isClickable ? handleStatusUpdate(e, order.id, status) : e.stopPropagation()}
                                        disabled={isUpdating || !isClickable}
                                        className={clsx(
                                          "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all cursor-default",
                                          isCompleted 
                                            ? "bg-primary border-primary text-white" 
                                            : isClickable
                                              ? "bg-white dark:bg-slate-900 border-primary text-primary cursor-pointer hover:scale-110"
                                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300"
                                        )}
                                        title={t(`orders:statusDesc.${status.toLowerCase()}`)}
                                      >
                                        {isUpdating && isClickable ? (
                                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : isCompleted ? (
                                          <Check size={12} strokeWidth={3} />
                                        ) : (
                                          <span className="text-[10px] font-bold">{index + 1}</span>
                                        )}
                                      </button>
                                      <span className={clsx(
                                        "text-[10px] font-bold whitespace-nowrap",
                                        isCurrent ? "text-primary" : isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
                                      )}>
                                        {t(`dashboard:status.${status.toLowerCase()}`)}
                                      </span>
                                    </div>
                                    {index < array.length - 1 && (
                                      <div className={clsx(
                                        "flex-1 h-0.5 mx-1 mb-4",
                                        statusesOrder.indexOf(order.status) > targetIndex ? "bg-primary" : "bg-slate-100 dark:bg-slate-800"
                                      )} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination footer */}
            {orderMeta && orderMeta.totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <button
                  onClick={handlePrevPage}
                  disabled={orderPage === 1}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 flex items-center gap-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('common:previous')}
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {orderPage} / {orderMeta.totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={orderPage >= orderMeta.totalPages}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 flex items-center gap-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  {t('common:next')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Driver Queue */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-2xl border border-primary/20 backdrop-blur-sm sticky top-6">
            <h3 className="font-black text-primary uppercase tracking-tight text-lg mb-2 flex items-center gap-2">
              <Truck size={24} />
              {t('orders:dispatchOrders')}
            </h3>
            
            <p className="text-xs font-bold text-primary/70 mb-6 uppercase tracking-wider">
              {t('orders:driverQueue')} — {t('orders:availableDrivers', { count: driverMeta?.total || availableDrivers.length })}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex-1 min-w-[120px]">
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <select
                    value={driverTownFilter}
                    onChange={(e) => setDriverTownFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-primary/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 appearance-none transition-all"
                  >
                    <option value="">{t('common:allTowns')}</option>
                    {uniqueTowns.map(town => (
                      <option key={town} value={town}>{town}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <select
                    value={driverPlaceFilter}
                    onChange={(e) => setDriverPlaceFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-primary/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 appearance-none transition-all"
                  >
                    <option value="">{t('common:allPlaces')}</option>
                    {uniquePlaces.map(place => (
                      <option key={place} value={place}>{place}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-white dark:border-slate-800 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('orders:selectedOrders', { count: selectedOrderIds.length })}</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedOrderIds.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 ease-out" 
                  style={{ width: `${(selectedOrderIds.length / (filteredOrders.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Unified Driver Queue List */}
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-white dark:border-slate-800">
              <div className="p-3 border-b border-white dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder={t('orders:searchDriverPlaceholder')}
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-3">
                {availableDrivers.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-400">{t('orders:noDriversFound')}</p>
                  </div>
                ) : (
                  availableDrivers.map((driver) => {
                    const isNextInTurn = driver.id === suggestedDriver?.id;
                    const originalIndex = availableDrivers.findIndex(d => d.id === driver.id);
                    const position = originalIndex + 1;
                    
                    return (
                      <div 
                        key={driver.id}
                        className={clsx(
                          "p-4 rounded-2xl transition-all group relative overflow-hidden",
                          isNextInTurn 
                            ? "bg-white dark:bg-slate-900 border-2 border-primary shadow-xl shadow-primary/10" 
                            : "bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:bg-white dark:hover:bg-slate-900"
                        )}
                      >
                        {/* Queue Badge */}
                        <div className={clsx(
                          "absolute top-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                          isRTL ? "left-0 rounded-br-xl" : "right-0 rounded-bl-xl",
                          isNextInTurn ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          {isNextInTurn ? t('orders:nextInQueue') : t('orders:queuePosition', { position })}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            "w-12 h-12 rounded-full flex items-center justify-center border-2 overflow-hidden font-black text-lg flex-shrink-0",
                            isNextInTurn ? "border-primary/20 bg-primary/5 text-primary" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400"
                          )}>
                            {driver.avatarUrl ? (
                              <img src={driver.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (driver.name || '?').charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={clsx(
                              "font-bold text-slate-900 dark:text-white truncate",
                              isRTL ? "pl-16" : "pr-16"
                            )}>{driver.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={clsx(
                                "text-[10px] px-2 py-0.5 font-bold rounded uppercase",
                                (driver.activeOrdersCount || 0) > 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                              )}>
                                {driver.activeOrdersCount || 0} {t('orders:activeTasks')}
                              </span>
                              {(driver.activeOrdersCount || 0) > 0 && (
                                <span className="text-[10px] px-2 py-0.5 font-bold rounded uppercase bg-rose-100 dark:bg-rose-900/30 text-rose-600 animate-pulse">
                                  {t('orders:onDelivery')}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 font-bold rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {driver.todayOrdersCount || 0} {t('orders:today', 'Today')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBatchAssign(driver.id, driver.name)}
                            disabled={dispatching || selectedOrderIds.length === 0}
                            className={clsx(
                              "p-3 rounded-xl transition-all duration-200",
                              selectedOrderIds.length > 0
                                ? isNextInTurn
                                  ? "bg-primary text-white hover:scale-110 shadow-lg shadow-primary/20"
                                  : "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:scale-110"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            )}
                          >
                            {dispatching ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Driver Queue Pagination */}
            {driverMeta && driverMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between px-2">
                <button
                  onClick={() => setDriverPage(prev => Math.max(1, prev - 1))}
                  disabled={driverPage === 1}
                  className="p-2 text-primary disabled:opacity-30 hover:bg-primary/10 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-black text-primary/60">
                  {driverPage} / {driverMeta.totalPages}
                </span>
                <button
                  onClick={() => setDriverPage(prev => Math.min(driverMeta.totalPages, prev + 1))}
                  disabled={driverPage >= driverMeta.totalPages}
                  className="p-2 text-primary disabled:opacity-30 hover:bg-primary/10 rounded-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={t('orders:batchAssignConfirmTitle')}
        message={`${t('orders:batchAssignConfirmMessage', { 
          count: selectedOrderIds.length, 
          driverName: confirmModal.driverName 
        })}\n\n${t('orders:batchAssignDriverWarning')}`}
        onConfirm={executeBatchAssign}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <ConfirmModal
        isOpen={statusConfirmModal.isOpen}
        title={t('orders:updateStatusTitle')}
        message={t('orders:updateStatusConfirm', { 
          status: t(`dashboard:status.${statusConfirmModal.status.toLowerCase()}`) 
        })}
        onConfirm={executeStatusUpdate}
        onCancel={() => setStatusConfirmModal({ ...statusConfirmModal, isOpen: false })}
      />
    </div>
  );
};

export default BatchAssign;
