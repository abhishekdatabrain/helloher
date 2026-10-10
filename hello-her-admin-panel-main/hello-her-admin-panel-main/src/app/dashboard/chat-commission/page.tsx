'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { endpoints } from '@/data/endpoints';
import { Fetch, Post, Put, Patch, Delete } from '@/hooks/apiUtils';
import AuthGuard from '@/components/AuthGuard';
import Loader from '@/components/common/Loader';
import Wrapper from '@/components/common/Wrapper';

interface ChatCommission {
    _id?: string;
    enabled: boolean;
    mode: 'perMinute' | 'perMessage';
    perMinuteAmountPaise?: number;
    perMessageAmountPaise?: number;
    commissionPercentage: number;
    providerSharePaise: number;
    adminSharePaise: number;
}

const ChatCommissionPage: React.FC = () => {
    const formType = 'Chat Commission';

    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState<ChatCommission[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [featureEnabled, setFeatureEnabled] = useState(true);

    const [form, setForm] = useState<ChatCommission>({
        enabled: true,
        mode: 'perMinute',
        perMinuteAmountPaise: 0,
        perMessageAmountPaise: 0,
        commissionPercentage: 0,
        providerSharePaise: 0,
        adminSharePaise: 0,
    });

    // Fetch
    const fetchData = async () => {
        try {
            setLoading(true);

            const res: any = await Fetch(endpoints[formType].url, {}, 5000, true, false);

            if (res) {
                setCommissions(res);

                // determine feature status
                const anyEnabled = res.some((c: ChatCommission) => c.enabled);
                setFeatureEnabled(anyEnabled);
            }
        } catch {
            toast.error('Error fetching chat commission');
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = async () => {
        try {

            const url = `${endpoints[formType].url}/feature/${featureEnabled ? 'disable' : 'enable'}`;

            await Patch(url, {});

            // toast.success(`Chat commission ${featureEnabled ? 'disabled' : 'enabled'}`);

            fetchData();

        } catch {
            toast.error('Failed to update feature status');
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    // Calculate Shares
    const calculateShares = (percentage: number, price: number) => {
        const provider = Math.round((price * percentage) / 100);
        const admin = price - provider;

        setForm((prev) => ({
            ...prev,
            commissionPercentage: percentage,
            providerSharePaise: provider,
            adminSharePaise: admin,
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            const url = endpoints[formType].url;

            let res: any;

            if (editingId) {
                res = await Put(`${url}/${editingId}`, form as unknown as Record<string, unknown>);
            } else {
                res = await Post(url, form as unknown as Record<string, unknown>);
            }

            if (res) {
                toast.success(editingId ? 'Updated successfully' : 'Created successfully');
                setEditingId(null);
                resetForm();
                fetchData();
            }

        } catch (err: any) {

            const backendMessage = err?.response?.data?.message;

            if (backendMessage) {
                toast.error(backendMessage);
                return;
            }

            console.log('Error saving chat commission');


        } finally {
            setIsSubmitting(false);
        }
    };
    const resetForm = () => {
        setForm({
            enabled: true,
            mode: 'perMinute',
            perMinuteAmountPaise: 0,
            perMessageAmountPaise: 0,
            commissionPercentage: 0,
            providerSharePaise: 0,
            adminSharePaise: 0,
        });
    };

    // Edit
    const handleEdit = (item: ChatCommission) => {
        setEditingId(item._id || null);
        setForm(item);
    };

    // Delete
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this commission?')) return;

        try {
            await Delete(`${endpoints[formType].url}/${id}`);
            toast.success('Deleted successfully');
            fetchData();
        } catch {
            toast.error('Delete failed');
        }
    };

    // Enable / Disable
    const toggleStatus = async (id: string, enabled: boolean) => {
        try {
            const url = `${endpoints[formType].url}/${id}/${enabled ? 'disable' : 'enable'}`;
            await Patch(url, {});
            fetchData();
        } catch {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <Loader />;

    return (
        <AuthGuard>
            <Wrapper>
                <div className="py-6">

                    <h1 className="text-3xl font-bold mb-8">
                        Chat Commission Management
                    </h1>

                    <div className="bg-white p-6 rounded-lg shadow mb-8 flex items-center justify-between">

                        <div>
                            <h2 className="text-lg font-semibold">Chat Commission Feature</h2>
                            <p className="text-sm text-gray-500">
                                Enable or disable chat commission globally
                            </p>
                        </div>

                        <button
                            onClick={toggleFeature}
                            className={`px-4 py-2 rounded text-sm font-medium ${featureEnabled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}
                        >
                            {featureEnabled ? 'Enabled' : 'Disabled'}
                        </button>

                    </div>

                    {/* FORM */}
                    <div className={`bg-white p-6 rounded-lg shadow mb-8 ${!featureEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid md:grid-cols-2 gap-4">

                            {/* MODE */}
                            <div>
                                <label className="text-sm font-medium">Mode</label>

                                <select
                                    value={form.mode}
                                    onChange={(e) =>
                                        setForm({ ...form, mode: e.target.value as any })
                                    }
                                    className="w-full border px-3 py-2 rounded"
                                >
                                    <option value="perMinute">Per Minute</option>
                                    <option value="perMessage">Per Message</option>
                                </select>
                            </div>

                            {/* PRICE */}
                            {form.mode === 'perMinute' ? (
                                <div>
                                    <label className="text-sm font-medium">
                                        Per Minute Price (Paise)
                                    </label>

                                    <input
                                        type="number"
                                        value={form.perMinuteAmountPaise}
                                        onChange={(e) => {
                                            const price = Number(e.target.value);

                                            setForm({
                                                ...form,
                                                perMinuteAmountPaise: price,
                                            });

                                            calculateShares(form.commissionPercentage, price);
                                        }}
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium">
                                        Per Message Price (Paise)
                                    </label>

                                    <input
                                        type="number"
                                        value={form.perMessageAmountPaise}
                                        onChange={(e) => {
                                            const price = Number(e.target.value);

                                            setForm({
                                                ...form,
                                                perMessageAmountPaise: price,
                                            });

                                            calculateShares(form.commissionPercentage, price);
                                        }}
                                        className="w-full border px-3 py-2 rounded"
                                    />
                                </div>
                            )}

                            {/* COMMISSION */}
                            <div>
                                <label className="text-sm font-medium">
                                    Commission Percentage
                                </label>

                                <input
                                    type="number"
                                    value={form.commissionPercentage}
                                    onChange={(e) => {
                                        const pct = Number(e.target.value);

                                        const price =
                                            form.mode === 'perMinute'
                                                ? form.perMinuteAmountPaise || 0
                                                : form.perMessageAmountPaise || 0;

                                        calculateShares(pct, price);
                                    }}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

                            {/* PROVIDER */}
                            <div>
                                <label className="text-sm font-medium">
                                    Provider Share (Paise)
                                </label>

                                <input
                                    type="number"
                                    value={form.providerSharePaise}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100"
                                />
                            </div>

                            {/* ADMIN */}
                            <div>
                                <label className="text-sm font-medium">
                                    Admin Share (Paise)
                                </label>

                                <input
                                    type="number"
                                    value={form.adminSharePaise}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100"
                                />
                            </div>

                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
                        >
                            <Save size={16} />
                            {editingId ? 'Update' : 'Create'}
                        </button>

                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-lg shadow">

                        <table className="w-full">

                            <thead className="border-b">

                                <tr>
                                    <th className="text-left p-3">Mode</th>
                                    <th className="text-left p-3">Price</th>
                                    <th className="text-left p-3">Provider</th>
                                    <th className="text-left p-3">Admin</th>
                                    <th className="text-left p-3">Provider %</th>
                                    <th className="text-left p-3">Status</th>
                                    <th className="text-right p-3">Actions</th>
                                </tr>

                            </thead>

                            <tbody>

                                {commissions.map((item) => (

                                    <tr key={item._id} className="border-b">

                                        <td className="p-3">{item.mode}</td>

                                        <td className="p-3">
                                            {item.mode === 'perMinute'
                                                ? item.perMinuteAmountPaise
                                                : item.perMessageAmountPaise}
                                        </td>

                                        <td className="p-3">{item.providerSharePaise}</td>

                                        <td className="p-3">{item.adminSharePaise}</td>

                                        <td className="p-3">{item.commissionPercentage}%</td>

                                        <td className="p-3">
                                            <button
                                                onClick={() =>
                                                    toggleStatus(item._id!, item.enabled)
                                                }
                                                className={`px-3 py-1 rounded text-sm ${item.enabled
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {item.enabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </td>

                                        <td className="p-3 flex justify-end gap-2">

                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(item._id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>
            </Wrapper>
        </AuthGuard>
    );
};

export default ChatCommissionPage;