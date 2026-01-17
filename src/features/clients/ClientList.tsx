import React, { useState, useEffect } from 'react';
import { User, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import clientsApi from './api/clients.api';

const ClientList = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data: any = await clientsApi.getStoreClients();
            setClients(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Store Clients</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Client</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">First Order</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Total Orders</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Total Spent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading clients...</td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No clients found.</td>
                                </tr>
                            ) : (
                                clients.map((clientData) => {
                                    // Verify structure based on controller/DTO
                                    // It seems to return StoreClientResponseDto which might wrap 'client' or be flat
                                    const client = clientData.client || clientData;
                                    return (
                                        <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white">
                                                            {client.firstName} {client.lastName}
                                                        </h3>
                                                        <p className="text-xs text-slate-500">{client.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} />
                                                    <span>{clientData.createdAt ? new Date(clientData.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-800 dark:text-white font-medium">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={16} className="text-slate-400" />
                                                    <span>{clientData.totalOrders || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-primary font-bold">
                                                <div className="flex items-center gap-1">
                                                    <DollarSign size={16} />
                                                    <span>{Number(clientData.totalSpent || 0).toFixed(2)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientList;
