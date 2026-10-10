"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Wrapper from "@/components/common/Wrapper";
import Loader from "@/components/common/Loader";
import { Fetch, Post, Put, Delete } from "@/hooks/apiUtils";
import { toast } from "react-toastify";

const API_BASE = "/api/availability-penalty";
// const TRIGGER_API = "/api/provider/apply-availability-penalty";

const Page: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [setting, setSetting] = useState<any>(null);

    const load = async () => {
        try {
            setLoading(true);
            const resp: any = await Fetch(API_BASE, {}, 5000, true, false);
            setSetting(resp?.data ?? resp ?? null);
        } catch (err) {
            console.error(err);
            setSetting(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleChange = (k: string, v: any) => {
        setSetting((s: any) => ({ ...(s || {}), [k]: v }));
    };

    const handleCreate = async () => {
        try {
            setSaving(true);
            const payload = {
                minCallsPerDay: Number(setting?.minCallsPerDay ?? 5),
                minOnlineHoursPerDay: Number(setting?.minOnlineHoursPerDay ?? 3),
                penaltyAmountRs: Number(setting?.penaltyAmountRs ?? 10),
                enabled: setting?.enabled ?? true,
                meta: setting?.meta ?? {},
            };
            await Post(API_BASE, payload);
            await load();
        } catch (err: any) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        try {
            if (!setting || !setting._id) return toast.error("No setting to update");
            setSaving(true);
            const payload = {
                minCallsPerDay: Number(setting.minCallsPerDay),
                minOnlineHoursPerDay: Number(setting.minOnlineHoursPerDay),
                penaltyAmountRs: Number(setting.penaltyAmountRs),
                enabled: setting.enabled,
                meta: setting.meta ?? {},
            };
            await Put(`${API_BASE}/${setting._id}`, payload);
            await load();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (!setting || !setting._id) return toast.error("No setting to delete");
            setSaving(true);
            await Delete(`${API_BASE}/${setting._id}`);
            setSetting(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // const handleTrigger = async () => {
    //     try {
    //         setSaving(true);
    //         await Post(TRIGGER_API, {});
    //         toast.success("Penalty job triggered");
    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    if (loading) return <Loader />;

    return (
        <AuthGuard>
            <Wrapper>
                <div className="w-full max-w-4xl px-4 lg:px-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

                        {/* Header */}
                        <div
                            className="px-6 py-4"
                            style={{ backgroundColor: "#2e7dfc" }}
                        >
                            <h2 className="text-lg font-semibold text-white">
                                Provider Availability Penalty
                            </h2>
                            <p className="text-xs text-blue-100 mt-0.5">
                                Configure daily activity requirements
                            </p>
                        </div>

                        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                            <p className="text-xs text-blue-700">
                                Note: This penalty system runs automatically every day at <span className="font-semibold">00:00</span>.
                                You can enable or disable it anytime using the toggle below.
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">

                            {/* Grid */}
                            <div className="grid grid-cols-2 gap-4">

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">
                                        Min Calls / Day
                                    </label>
                                    <input
                                        type="number"
                                        value={setting?.minCallsPerDay ?? 5}
                                        onChange={(e) =>
                                            handleChange("minCallsPerDay", e.target.value)
                                        }
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">
                                        Min Online Hours / Day
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={setting?.minOnlineHoursPerDay ?? 3}
                                        onChange={(e) =>
                                            handleChange("minOnlineHoursPerDay", e.target.value)
                                        }
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>

                            </div>

                            {/* Penalty */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">
                                    Penalty Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={setting?.penaltyAmountRs ?? 10}
                                    onChange={(e) =>
                                        handleChange("penaltyAmountRs", e.target.value)
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Toggle Row */}
                            <div className="flex items-center justify-between border rounded-md px-4 py-3 bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">
                                    Enable Penalty
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleChange("enabled", !setting?.enabled)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${setting?.enabled ? "bg-[#2e7dfc]" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${setting?.enabled ? "translate-x-5" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                {!setting || !setting._id ? (
                                    <button
                                        onClick={handleCreate}
                                        disabled={saving}
                                        className="px-4 py-2 text-sm rounded-md bg-[#2e7dfc] text-white hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Create"}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={saving}
                                            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>

                                        <button
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {saving ? "Deleting..." : "Delete"}
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </Wrapper>
        </AuthGuard>
    );
};

export default Page;
