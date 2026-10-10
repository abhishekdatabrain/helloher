'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { endpoints } from '@/data/endpoints';
import { Fetch, Post, Put, Delete } from '@/hooks/apiUtils';
import AuthGuard from '@/components/AuthGuard';
import Loader from '@/components/common/Loader';
import Wrapper from '@/components/common/Wrapper';

interface CommissionSlab {
  _id?: string;
  minSeconds: number;
  maxSeconds: number;
  providerSharePaise: number;
  adminSharePaise: number;
  commissionPercentage?: number;
}

interface Commission {
  _id?: string;
  perMinutePricePaise: number;
  useGlobalCommission: boolean;
  globalCommissionPercentage: number;
  minimumWithdrawalAmount: number;
  commissionSlabs: CommissionSlab[];
}

interface SlabFormData {
  minSeconds: string;
  maxSeconds: string;
  providerSharePaise: string;
  adminSharePaise: string;
  commissionPercentage: string;
}

const CommissionPage: React.FC = () => {
  const formType = 'Commission';
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingSlabId, setEditingSlabId] = useState<string | null>(null);
  const [manualAdminEdit, setManualAdminEdit] = useState(false);

  const [perMinutePricePaise, setPerMinutePricePaise] = useState<string>('600');

  // Global toggle + percentage
  const [useGlobalCommission, setUseGlobalCommission] = useState<boolean>(false);
  const [globalCommissionPercentage, setGlobalCommissionPercentage] = useState<string>('0');
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState<string>('100');

  const [slabForm, setSlabForm] = useState<SlabFormData>({
    minSeconds: '',
    maxSeconds: '',
    providerSharePaise: '',
    adminSharePaise: '',
    commissionPercentage: '',
  });

  // ✅ Fetch Commission Data
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        setLoading(true);
        const response: any = await Fetch(endpoints[formType].url, {}, 5000, true, false);
        if (response?.success) {
          const commissionData: Commission =
            response?.data?.result?.[0] || response?.data;

          setCommission(commissionData);
          setPerMinutePricePaise(
            (commissionData.perMinutePricePaise ?? 600).toString()
          );
          setUseGlobalCommission(!!commissionData.useGlobalCommission);
          setGlobalCommissionPercentage(
            (commissionData.globalCommissionPercentage ?? 0).toString()
          );
          setMinimumWithdrawalAmount(
            (commissionData.minimumWithdrawalAmount ?? 100).toString()
          );
        } else {
          toast.error('Failed to fetch commission data');
        }
      } catch (error) {
        console.error('Error fetching commission:', error);
        toast.error('Error fetching commission data');
      } finally {
        setLoading(false);
      }
    };
    fetchCommission();
  }, []);

  const perMinute = useMemo(
    () => parseFloat(perMinutePricePaise) || 0,
    [perMinutePricePaise]
  );
  const globalPct = useMemo(
    () => Math.max(0, Math.min(100, parseFloat(globalCommissionPercentage) || 0)),
    [globalCommissionPercentage]
  );

  // Toggle handler: keep slab % intact; just preview using global when ON
  const handleToggleUseGlobalCommission = (checked: boolean) => {
    setUseGlobalCommission(checked);

    // If a slab form is open, recompute visible provider/admin preview
    if (isAddingOrEditing) {
      const pct = checked
        ? globalPct
        : Math.max(0, Math.min(100, parseFloat(slabForm.commissionPercentage) || 0));

      const total = parseFloat(perMinutePricePaise) || 0;
      const provider = Math.round((total * pct) / 100);
      const admin = Math.round(total - provider);

      setSlabForm((prev) => ({
        ...prev,
        providerSharePaise: provider.toString(),
        adminSharePaise: admin.toString(),
      }));
    }
  };

  // Recompute preview live while editing if global % changes
  useEffect(() => {
    if (useGlobalCommission && isAddingOrEditing) {
      const total = parseFloat(perMinutePricePaise) || 0;
      const pct = globalPct;
      const provider = Math.round((total * pct) / 100);
      const admin = Math.round(total - provider);
      setSlabForm((prev) => ({
        ...prev,
        providerSharePaise: provider.toString(),
        adminSharePaise: admin.toString(),
      }));
    }
  }, [useGlobalCommission, globalCommissionPercentage, perMinutePricePaise, isAddingOrEditing, globalPct]);

  // ✅ Create/Update Commission (document-level)
  const createOrUpdateCommission = async () => {
    try {
      setIsSubmitting(true);

      const newPerMinute = parseFloat(perMinutePricePaise);
      const newMinWithdrawal = parseFloat(minimumWithdrawalAmount);

      if (isNaN(newPerMinute) || newPerMinute <= 0) {
        toast.error('Please enter a valid per-minute price');
        return;
      }
      if (isNaN(newMinWithdrawal) || newMinWithdrawal < 0) {
        toast.error('Please enter a valid minimum withdrawal amount');
        return;
      }

      // Recompute shares for display: if global is ON, use global %, else use each slab %
      const updatedSlabs = (commission?.commissionSlabs || []).map((slab) => {
        const pct = useGlobalCommission
          ? globalPct
          : parseFloat(slab.commissionPercentage?.toString() || '0');

        const provider = (newPerMinute * pct) / 100;
        const admin = newPerMinute - provider;

        return {
          ...slab,
          providerSharePaise: Math.max(0, Math.round(provider)),
          adminSharePaise: Math.max(0, Math.round(admin)),
        };
      });

      const payload = {
        perMinutePricePaise: newPerMinute,
        useGlobalCommission,
        globalCommissionPercentage: globalPct,
        minimumWithdrawalAmount: newMinWithdrawal,
        commissionSlabs: updatedSlabs,
      };

      const url = endpoints[formType].url;
      const response: any = commission?._id
        ? await Put(`${url}`, payload)
        : await Post(url, payload);

      if (response.success) {
        toast.success('Global settings updated successfully');
        const data: Commission = response.data?.result || response.data;
        setCommission(data);
        setUseGlobalCommission(!!data.useGlobalCommission);
        setGlobalCommissionPercentage(
          (data.globalCommissionPercentage ?? 0).toString()
        );
        setMinimumWithdrawalAmount(
          (data.minimumWithdrawalAmount ?? 100).toString()
        );
      } else {
        toast.error('Failed to update commission');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating commission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Add or Edit Slab
  const handleSubmitSlab = async () => {
    if (
      !slabForm.minSeconds ||
      !slabForm.maxSeconds ||
      !slabForm.providerSharePaise ||
      !slabForm.adminSharePaise
    ) {
      toast.error('All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        minSeconds: parseInt(slabForm.minSeconds),
        maxSeconds: parseInt(slabForm.maxSeconds),
        providerSharePaise: parseFloat(slabForm.providerSharePaise),
        adminSharePaise: parseFloat(slabForm.adminSharePaise),
        commissionPercentage: parseFloat(slabForm.commissionPercentage) || 0,
      };

      let url = `${endpoints[formType].url}/slab`;
      let response: any;

      if (editingSlabId) {
        url = `${url}/${editingSlabId}`;
        response = await Put(url, payload);
      } else {
        response = await Post(url, payload);
      }

      if (response.success) {
        toast.success(editingSlabId ? 'Slab updated successfully' : 'Slab created successfully');
        handleCancelSlabForm();
        const refetch: any = await Fetch(endpoints[formType].url, {}, 5000, true, false);
        const data: Commission = refetch?.data?.result?.[0] || refetch?.data;
        setCommission(data);
      } else {
        toast.error('Failed to save slab');
      }
    } catch (error) {
      console.error('Error saving slab:', error);
      toast.error('Error saving slab');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Delete Slab
  const handleDeleteSlab = async (slabId: string) => {
    if (!window.confirm('Are you sure you want to delete this slab?')) return;

    try {
      setIsSubmitting(true);
      const url = `${endpoints[formType].url}/slab/${slabId}`;
      const response: any = await Delete(url);

      if (response.success) {
        toast.success('Slab deleted successfully');
        const refetch: any = await Fetch(endpoints[formType].url, {}, 5000, true, false);
        const data: Commission = refetch?.data?.result?.[0] || refetch?.data;
        setCommission(data);
      } else {
        toast.error('Failed to delete slab');
      }
    } catch (error) {
      console.error('Error deleting slab:', error);
      toast.error('Error deleting slab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSlab = () => {
    setIsAddingOrEditing(true);
    setEditingSlabId(null);
    setSlabForm({
      minSeconds: '',
      maxSeconds: '',
      providerSharePaise: '',
      adminSharePaise: '',
      commissionPercentage: '',
    });
  };

  const handleEditSlab = (slab: CommissionSlab) => {
    setIsAddingOrEditing(true);
    setEditingSlabId(slab._id || null);
    setSlabForm({
      minSeconds: slab.minSeconds.toString(),
      maxSeconds: slab.maxSeconds.toString(),
      providerSharePaise: slab.providerSharePaise.toString(),
      adminSharePaise: slab.adminSharePaise.toString(),
      commissionPercentage: slab.commissionPercentage?.toString() || '0',
    });
  };

  const handleCancelSlabForm = () => {
    setIsAddingOrEditing(false);
    setEditingSlabId(null);
    setSlabForm({
      minSeconds: '',
      maxSeconds: '',
      providerSharePaise: '',
      adminSharePaise: '',
      commissionPercentage: '',
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const computeSharesFromPct = (pct: number) => {
    const provider = Math.max(0, Math.round((perMinute * pct) / 100));
    const admin = Math.max(0, Math.round(perMinute - provider));
    return { provider, admin };
  };

  if (loading) return <Loader />;

  return (
    <AuthGuard>
      <Wrapper>
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Commission Management</h1>

          {/* GLOBAL SETTINGS */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Global Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Minute Price (Paise)
                </label>
                <input
                  type="number"
                  value={perMinutePricePaise}
                  onChange={(e) => setPerMinutePricePaise(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Global Commission
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="useGlobalCommission"
                    type="checkbox"
                    checked={useGlobalCommission}
                    onChange={(e) => handleToggleUseGlobalCommission(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <span className="text-sm text-gray-700">
                    When ON, slab-level % is ignored
                  </span>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Global Commission (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={globalCommissionPercentage}
                  onChange={(e) => setGlobalCommissionPercentage(e.target.value)}
                  disabled={!useGlobalCommission}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
                {useGlobalCommission && (
                  <p className="text-xs text-gray-500 mt-1">
                    Provider/Admin shares will preview using this %.
                  </p>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Withdrawal (Paise)
                </label>
                <input
                  type="number"
                  value={minimumWithdrawalAmount}
                  onChange={(e) => setMinimumWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Preview effective shares for the configured % */}
            <div className="mt-4 text-sm text-gray-700">
              {useGlobalCommission ? (
                <>
                  {(() => {
                    const { provider, admin } = computeSharesFromPct(globalPct);
                    return (
                      <div className="p-3 rounded-md bg-blue-50 border border-blue-100">
                        Using <b>Global {globalPct}%</b> → Provider: <b>{provider}</b> paise,
                        Admin: <b>{admin}</b> paise (per minute).
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  Global commission is <b>OFF</b>. Slab % values apply.
                </div>
              )}
            </div>

            <button
              onClick={createOrUpdateCommission}
              disabled={isSubmitting}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Updating...' : 'Save Global Settings'}
            </button>
          </div>

          {/* SLAB SECTION */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Commission Slabs</h2>
              {!isAddingOrEditing && (
                <button
                  onClick={handleAddSlab}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Slab
                </button>
              )}
            </div>

            {/* SLAB FORM */}
            {isAddingOrEditing && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {editingSlabId ? 'Edit Slab' : 'Add New Slab'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Seconds
                    </label>
                    <input
                      type="number"
                      value={slabForm.minSeconds}
                      onChange={(e) => setSlabForm({ ...slabForm, minSeconds: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Seconds
                    </label>
                    <input
                      type="number"
                      value={slabForm.maxSeconds}
                      onChange={(e) => setSlabForm({ ...slabForm, maxSeconds: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Share (Paise)
                    </label>
                    <input
                      type="number"
                      value={slabForm.providerSharePaise}
                      onChange={(e) => {
                        const providerValue = e.target.value;
                        let adminValue = slabForm.adminSharePaise;

                        if (perMinute && !manualAdminEdit) {
                          const total = perMinute || 0;
                          const provider = parseFloat(providerValue) || 0;
                          const autoAdmin = total - provider >= 0 ? total - provider : 0;
                          adminValue = autoAdmin.toString();
                        }

                        setSlabForm({
                          ...slabForm,
                          providerSharePaise: providerValue,
                          adminSharePaise: adminValue,
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Share (Paise)
                    </label>
                    <input
                      type="number"
                      value={slabForm.adminSharePaise}
                      onChange={(e) => {
                        setManualAdminEdit(true);
                        setSlabForm({ ...slabForm, adminSharePaise: e.target.value });
                      }}
                      onBlur={() => setManualAdminEdit(false)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Commission Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={
                        useGlobalCommission
                          ? globalCommissionPercentage
                          : slabForm.commissionPercentage
                      }
                      disabled={useGlobalCommission}
                      onChange={(e) => {
                        const percentage = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                        const pctToUse = useGlobalCommission ? globalPct : percentage;
                        const total = perMinute || 0;
                        const provider = (total * pctToUse) / 100;
                        const admin = total - provider;

                        setSlabForm({
                          ...slabForm,
                          commissionPercentage: percentage.toString(),
                          providerSharePaise: Math.round(provider).toString(),
                          adminSharePaise: Math.round(admin).toString(),
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                    {useGlobalCommission && (
                      <p className="text-xs text-blue-600 mt-1">
                        Global is ON — slab % is ignored.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitSlab}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : editingSlabId ? 'Update Slab' : 'Create Slab'}
                  </button>
                  <button
                    onClick={handleCancelSlabForm}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SLAB LIST */}
            {commission?.commissionSlabs?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Duration Range</th>
                      <th className="text-left py-3 px-4">Provider Share</th>
                      <th className="text-left py-3 px-4">Admin Share</th>
                      <th className="text-left py-3 px-4">Commission %</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commission.commissionSlabs.map((slab) => {
                      const pctShown = useGlobalCommission
                        ? globalPct
                        : slab.commissionPercentage ?? 0;

                      return (
                        <tr key={slab._id}>
                          <td className="py-3 px-4">
                            {formatTime(slab.minSeconds)} - {formatTime(slab.maxSeconds)}
                          </td>
                          <td className="py-3 px-4">{(slab.providerSharePaise).toFixed(0)}</td>
                          <td className="py-3 px-4">{(slab.adminSharePaise).toFixed(0)}</td>
                          <td className="py-3 px-4">
                            {pctShown}% {useGlobalCommission && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                Global
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleEditSlab(slab)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => slab._id && handleDeleteSlab(slab._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No commission slabs found. Click “Add New Slab” to create one.
              </div>
            )}
          </div>
        </div>
      </Wrapper>
    </AuthGuard>
  );
};

export default CommissionPage;
