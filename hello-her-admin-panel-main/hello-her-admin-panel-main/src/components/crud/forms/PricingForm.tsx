import { toast } from 'react-toastify';
import { endpoints } from '@/data/endpoints';
import React, { useState, useEffect } from 'react';
import { Fetch, Post, Put } from '@/hooks/apiUtils';
import { getSelectFormattedData } from '@/hooks/general';
import {
    FaCog,
    FaPlus,
    FaUsers,
    FaClock,
    FaTrash,
    FaRupeeSign,
    FaCalendarAlt,
} from "react-icons/fa";

export type PricingTarget = "room" | "property";
export enum Currency { USD = "USD", INR = "INR", EUR = "EUR", GBP = "GBP" }
export enum PriceUnit { NIGHT = "night", WEEK = "week", MONTH = "month" }

export interface ISeasonalPricing {
    name: string;
    endDate: string;
    startDate: string;
    isActive: boolean;
    priceMultiplier: number;
}

export interface IAdditionalFee {
    key: string;
    name: string;
    amount: number;
    isActive: boolean;
    isRequired: boolean;
}

export interface IDynamicRule {
    key: string;
    payload: any;
    priority?: number;
    isActive?: boolean;
    type: "min_stay_override" | "guest_surcharge" | "date_override" | "percentage_discount";
}

export interface IPricingFormData {
    target: PricingTarget;
    roomId?: string;
    propertyId?: string;
    basePrice: number;
    currency: Currency;
    priceUnit: PriceUnit;
    cleaningFee: number;
    additionalFees: IAdditionalFee[];
    seasonalPricing: ISeasonalPricing[];
    maxGuests: number;
    minimumStay: number;
    maximumStay?: number;
    extraGuestChargePerGuestPerNight?: number;
    dynamicRules?: IDynamicRule[];
}

const PricingForm = (props: any) => {
    const initialData = props.data;
    const formType = props.formType;
    const [isLoading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<any>([]);
    const [properties, setProperties] = useState<any>([]);
    const [formData, setFormData] = useState<IPricingFormData>({
        basePrice: 0,
        maxGuests: 1,
        minimumStay: 1,
        target: 'room',
        cleaningFee: 0,
        dynamicRules: [],
        additionalFees: [],
        seasonalPricing: [],
        maximumStay: undefined,
        currency: Currency.INR,
        priceUnit: PriceUnit.NIGHT,
        extraGuestChargePerGuestPerNight: 0,
        ...initialData
    });

    const [activeTab, setActiveTab] = useState<'basic' | 'seasonal' | 'fees' | 'rules'>('basic');

    // Update form data when initial data changes
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleInputChange = (field: keyof IPricingFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addSeasonalPricing = () => {
        const newSeason: ISeasonalPricing = {
            name: '',
            startDate: '',
            endDate: '',
            isActive: true,
            priceMultiplier: 1
        };
        setFormData(prev => ({
            ...prev,
            seasonalPricing: [...prev.seasonalPricing, newSeason]
        }));
    };

    const updateSeasonalPricing = (index: number, field: keyof ISeasonalPricing, value: any) => {
        setFormData(prev => ({
            ...prev,
            seasonalPricing: prev.seasonalPricing.map((season, i) =>
                i === index ? { ...season, [field]: value } : season
            )
        }));
    };

    const removeSeasonalPricing = (index: number) => {
        setFormData(prev => ({
            ...prev,
            seasonalPricing: prev.seasonalPricing.filter((_, i) => i !== index)
        }));
    };

    const addAdditionalFee = () => {
        const newFee: IAdditionalFee = {
            key: '',
            name: '',
            amount: 0,
            isActive: true,
            isRequired: false
        };
        setFormData(prev => ({
            ...prev,
            additionalFees: [...prev.additionalFees, newFee]
        }));
    };

    const updateAdditionalFee = (index: number, field: keyof IAdditionalFee, value: any) => {
        setFormData(prev => ({
            ...prev,
            additionalFees: prev.additionalFees.map((fee, i) =>
                i === index ? { ...fee, [field]: value } : fee
            )
        }));
    };

    const removeAdditionalFee = (index: number) => {
        setFormData(prev => ({
            ...prev,
            additionalFees: prev.additionalFees.filter((_, i) => i !== index)
        }));
    };

    const addDynamicRule = () => {
        const newRule: IDynamicRule = {
            key: '',
            type: 'percentage_discount',
            payload: {},
            priority: 10,
            isActive: true
        };
        setFormData(prev => ({
            ...prev,
            dynamicRules: [...(prev.dynamicRules || []), newRule]
        }));
    };

    const updateDynamicRule = (index: number, field: keyof IDynamicRule, value: any) => {
        setFormData(prev => ({
            ...prev,
            dynamicRules: (prev.dynamicRules || []).map((rule, i) =>
                i === index ? { ...rule, [field]: value } : rule
            )
        }));
    };

    const removeDynamicRule = (index: number) => {
        setFormData(prev => ({
            ...prev,
            dynamicRules: (prev.dynamicRules || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = `${endpoints[formType].url}${!initialData._id ? "" : "/" + initialData._id
                }`;

            if (!formData.propertyId) return toast.warn("Please Select Property!")
            if (!formData.roomId && formData?.target === "room") return toast.warn("Please Select Room!")
            if (formData.roomId && formData?.target === "property") return toast.warn("Please Select target `Room`!")

            setLoading(true);
            const updatedData: any = formData;
            const response: any = initialData._id
                ? await Put(url, updatedData)
                : await Post(url, updatedData);

            if (response.success) {
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
                if (resp?.success) props?.setFilteredData(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination)
                    props?.setPaginate(resp?.data?.pagination);
                props.onClose?.();
            } else return toast.error("Something went wrong!");
        } catch (error) {
            console.log("Error: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const url = "/api/property";
                const params = { limit: 30000, page: 1, status: "active" };
                const response: any = await Fetch(url, params, 5000, true, false);
                if (response.success && response?.data?.result.length > 0) {
                    const selectData = getSelectFormattedData(response?.data?.result);
                    setProperties(selectData)
                }
            } catch (error) {
                console.log("Error: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    useEffect(() => {
        const fetchRoomsByProperty = async () => {
            try {
                const url = "/api/room";
                const params = { limit: 300, page: 1, property: formData.propertyId };
                const response: any = await Fetch(url, params, 5000, true, false);
                if (response.success && response?.data?.result.length > 0) {
                    const selectData = getSelectFormattedData(response?.data?.result);
                    setRooms(selectData)
                }
            } catch (error) {
                console.log("Error: ", error);
            } finally {
                setLoading(false);
            }
        };
        if (formData.propertyId) fetchRoomsByProperty();
    }, [formData.propertyId]);

    const renderBasicFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className='col-span-2'>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Property
                    </label>
                    <select
                        value={formData.propertyId}
                        onChange={(e) => handleInputChange('propertyId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option className='' value={""}>Select Property</option>
                        {properties.map((curr: any) => (
                            <option key={curr.label} value={curr.label}>{curr?.value}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Room
                    </label>
                    <select
                        value={formData.roomId}
                        onChange={(e) => handleInputChange('roomId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option className='' value={""}>Select Room</option>
                        {rooms.map((curr: any) => (
                            <option key={curr.label} value={curr.label}>{curr?.value}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Type
                    </label>
                    <select
                        value={formData.target}
                        onChange={(e) => handleInputChange('target', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="room">Room</option>
                        <option value="property">Property</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                    </label>
                    <div className="relative">
                        <FaRupeeSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                    </label>
                    <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(Currency).map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price Unit
                    </label>
                    <select
                        value={formData.priceUnit}
                        onChange={(e) => handleInputChange('priceUnit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(PriceUnit).map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Guests
                    </label>
                    <div className="relative">
                        <FaUsers className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                            type="number"
                            value={formData.maxGuests}
                            onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value) || 1)}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Stay (nights)
                    </label>
                    <div className="relative">
                        <FaClock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                            type="number"
                            value={formData.minimumStay}
                            onChange={(e) => handleInputChange('minimumStay', parseInt(e.target.value) || 1)}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Stay (nights)
                    </label>
                    <input
                        type="number"
                        placeholder='Max People can stay'
                        value={formData.maximumStay || ''}
                        onChange={(e) => handleInputChange('maximumStay', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extra Guest Charge (per night)
                    </label>
                    <input
                        type="number"
                        value={formData.extraGuestChargePerGuestPerNight || 0}
                        onChange={(e) => handleInputChange('extraGuestChargePerGuestPerNight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cleaning Fee
                    </label>
                    <input
                        type="number"
                        value={formData.cleaningFee}
                        onChange={(e) => handleInputChange('cleaningFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

        </div>
    );

    const renderSeasonalPricing = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Seasonal Pricing</h3>
                <button
                    type="button"
                    onClick={addSeasonalPricing}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="h-3 w-3 mr-2" />
                    Add Season
                </button>
            </div>

            {formData.seasonalPricing.map((season, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Season {index + 1}</h4>
                        <button
                            type="button"
                            onClick={() => removeSeasonalPricing(index)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <FaTrash className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 items-center gap-4">
                        <div className='col-span-2'>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Season Name
                            </label>
                            <input
                                type="text"
                                value={season.name}
                                placeholder='Add Season (monsoon , summer etc.)'
                                onChange={(e) => updateSeasonalPricing(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price Multiplier
                            </label>
                            <input
                                type="number"
                                value={season.priceMultiplier}
                                onChange={(e) => updateSeasonalPricing(index, 'priceMultiplier', parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0.01"
                                max="10"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={season.startDate.split("T")[0]}
                                onChange={(e) => updateSeasonalPricing(index, 'startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={season.endDate.split("T")[0]}
                                onChange={(e) => updateSeasonalPricing(index, 'endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={season.isActive}
                                onChange={(e) => updateSeasonalPricing(index, 'isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Active
                            </label>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );

    const renderAdditionalFees = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Additional Fees</h3>
                <button
                    type="button"
                    onClick={addAdditionalFee}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="h-3 w-3 mr-2" />
                    Add Fee
                </button>
            </div>

            {formData.additionalFees.map((fee, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-700">Fee {index + 1}</h4>
                        <button
                            type="button"
                            onClick={() => removeAdditionalFee(index)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <FaTrash className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fee Key
                            </label>
                            <input
                                type="text"
                                value={fee.key}
                                placeholder='Enter key'
                                onChange={(e) => updateAdditionalFee(index, 'key', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fee Name
                            </label>
                            <input
                                type="text"
                                value={fee.name}
                                placeholder='Enter Name'
                                onChange={(e) => updateAdditionalFee(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                            </label>
                            <input
                                min="0"
                                step="0.01"
                                type="number"
                                value={fee.amount}
                                onChange={(e) => updateAdditionalFee(index, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={fee.isActive}
                                    onChange={(e) => updateAdditionalFee(index, 'isActive', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={fee.isRequired}
                                    onChange={(e) => updateAdditionalFee(index, 'isRequired', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Required
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDynamicRules = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Dynamic Rules</h3>
                <button
                    type="button"
                    onClick={addDynamicRule}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="h-3 w-3 mr-2" />
                    Add Rule
                </button>
            </div>

            {(formData.dynamicRules || []).map((rule, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700">Rule {index + 1}</h4>
                        <button
                            type="button"
                            onClick={() => removeDynamicRule(index)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <FaTrash className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rule Key
                            </label>
                            <input
                                type="text"
                                value={rule.key}
                                placeholder='Enter rule'
                                onChange={(e) => updateDynamicRule(index, 'key', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rule Type
                            </label>
                            <select
                                value={rule.type}
                                onChange={(e) => updateDynamicRule(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="min_stay_override">Min Stay Override</option>
                                <option value="guest_surcharge">Guest Surcharge</option>
                                <option value="date_override">Date Override</option>
                                <option value="percentage_discount">Percentage Discount</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <input
                                type="number"
                                value={rule.priority || 10}
                                onChange={(e) => updateDynamicRule(index, 'priority', parseInt(e.target.value) || 10)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                            />
                        </div>

                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payload (JSON)
                            </label>
                            <textarea
                                value={JSON.stringify(rule.payload || {}, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        updateDynamicRule(index, 'payload', parsed);
                                    } catch (err) {
                                        // Invalid JSON, keep the string value for editing
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div> */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={rule.isActive !== false}
                                onChange={(e) => updateDynamicRule(index, 'isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Active
                            </label>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );

    return (
        <div className="mx-auto bg-white">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    {[
                        { key: 'basic', label: 'Basic Settings', icon: FaRupeeSign },
                        { key: 'seasonal', label: 'Seasonal Pricing', icon: FaCalendarAlt },
                        { key: 'fees', label: 'Additional Fees', icon: FaPlus },
                        { key: 'rules', label: 'Dynamic Rules', icon: FaCog }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key as any)}
                            className={`flex items-center py-2 px-1 border-b-4 font-medium text-sm ${activeTab === key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="h-3 w-3 mr-2" />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="pt-4">
                <div className="mb-8">
                    {activeTab === 'basic' && renderBasicFields()}
                    {activeTab === 'seasonal' && renderSeasonalPricing()}
                    {activeTab === 'fees' && renderAdditionalFees()}
                    {activeTab === 'rules' && renderDynamicRules()}
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save Pricing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PricingForm;