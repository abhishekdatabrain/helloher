import React, { useEffect, useState } from 'react';
import {
    FaBed, FaUtensils, FaBath, FaDesktop, FaTools,
    FaLeaf, FaChevronDown, FaChevronUp, FaTimes, FaCheck,
    FaPlug, FaThermometerHalf, FaBoxes, FaStar, FaMobileAlt,
    FaHome, FaRuler, FaWindowMaximize, FaDoorOpen, FaLightbulb,
} from 'react-icons/fa';

interface Feature {
    name: string;
    value: string;
    unit?: string | null;
}

// interface RoomFeaturesData {
//     features: Feature[];
//     amenities: string[];
// }

const RoomFeaturesSelector = ({ data, setFormData }: { data: any, setFormData: any }) => {
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['']));
    const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>(data?._id ? data?.features : []);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(data?._id ? data?.amenities : []);
    const [customInputs, setCustomInputs] = useState<{ [key: string]: { value: string, unit: string } }>(
        data?._id
            ? (data.features || []).reduce((acc: any, feature: any) => {
                acc[feature.name] = {
                    value: feature.value,
                    unit: feature.unit || ""
                };
                return acc;
            }, {} as { [key: string]: { value: string; unit: string } })
            : {}
    );

    const featureCategories = {
        flooring: {
            icon: FaHome,
            title: 'Flooring',
            options: [
                'Hardwood - Oak', 'Hardwood - Maple', 'Hardwood - Cherry', 'Hardwood - Walnut', 'Hardwood - Bamboo',
                'Tile - Ceramic', 'Tile - Porcelain', 'Tile - Natural Stone', 'Tile - Marble', 'Tile - Granite',
                'Carpet - Wool', 'Carpet - Nylon', 'Carpet - Berber', 'Laminate', 'Vinyl - LVT', 'Vinyl - LVP',
                'Concrete - Polished', 'Concrete - Stained', 'Cork', 'Linoleum', 'Rubber', 'Terrazzo', 'Tatami'
            ]
        },
        dimensions: {
            icon: FaRuler,
            title: 'Dimensions',
            customFields: [
                { name: 'Ceiling Height', units: ['ft', 'm'] },
                { name: 'Room Area', units: ['sq ft', 'sq m'] },
                { name: 'Window Area', units: ['sq ft', 'sq m'] },
                { name: 'Length', units: ['ft', 'm'] },
                { name: 'Width', units: ['ft', 'm'] },
                { name: 'Wall Thickness', units: ['in', 'cm'] },
                { name: 'Door Height', units: ['ft', 'm'] },
                { name: 'Door Width', units: ['ft', 'm'] },
                { name: 'Balcony Area', units: ['sq ft', 'sq m'] },
                { name: 'Storage Capacity', units: ['cu ft', 'cu m'] }
            ]
        },
        windows: {
            icon: FaWindowMaximize,
            title: 'Windows',
            options: [
                'Single Hung', 'Double Hung', 'Casement', 'Awning', 'Sliding', 'Picture',
                'Bay Window', 'Bow Window', 'Garden Window', 'Jalousie', 'Skylight',
                'Double Pane Glass', 'Triple Pane Glass', 'Low-E Glass', 'Smart Glass'
            ]
        },
        doors: {
            icon: FaDoorOpen,
            title: 'Doors & Access',
            options: [
                'Hinged Door', 'Sliding Door', 'Pocket Door', 'French Doors', 'Bifold Door',
                'Barn Door', 'Glass Panel Door', 'Dutch Door', 'Electronic Lock', 'Smart Lock'
            ]
        },
        lighting: {
            icon: FaLightbulb,
            title: 'Lighting',
            options: [
                'Recessed Lighting', 'Pendant Lights', 'Chandelier', 'Track Lighting',
                'Wall Sconces', 'Ceiling Fan with Light', 'Dimmer Controls', 'Smart Lighting',
                'Motion Sensor Lights', 'LED Lighting', 'Natural Light - Excellent',
                'Natural Light - Good', 'Natural Light - Moderate'
            ]
        },
        electrical: {
            icon: FaPlug,
            title: 'Electrical',
            options: [
                'Standard Outlets', 'GFCI Outlets', 'USB Outlets', 'Smart Outlets',
                '220V Outlet', 'Ethernet Connection', 'Cable Ready', 'Fiber Ready',
                'Built-in Speakers', 'Intercom System'
            ]
        }
    };

    const amenityCategories = {
        climate: {
            icon: FaThermometerHalf,
            title: 'Climate Control',
            options: [
                'Air Conditioning', 'Central Heating', 'Heat Pump', 'Radiant Floor Heating',
                'Fireplace - Gas', 'Fireplace - Wood', 'Fireplace - Electric', 'Ceiling Fan',
                'Smart Thermostat', 'Zone Control', 'Whole House Fan'
            ]
        },
        storage: {
            icon: FaBoxes,
            title: 'Storage',
            options: [
                'Walk-in Closet', 'Reach-in Closet', 'Built-in Shelving', 'Built-in Cabinets',
                'Custom Closet System', 'Cedar Closet', 'Linen Closet', 'Pantry',
                'Under-stair Storage', 'Window Seat Storage'
            ]
        },
        luxury: {
            icon: FaStar,
            title: 'Luxury Features',
            options: [
                'Crown Molding', 'Coffered Ceiling', 'Tray Ceiling', 'Wainscoting',
                'Chair Rail', 'Built-in Entertainment Center', 'Wine Storage',
                'Wet Bar', 'Reading Nook', 'Bay Window Seat', 'Exposed Beams'
            ]
        },
        smart: {
            icon: FaMobileAlt,
            title: 'Smart Home',
            options: [
                'Smart Home Integration', 'Voice Control', 'Automated Blinds',
                'Security System', 'Video Doorbell', 'Smart Locks', 'App Control',
                'Energy Monitoring', 'Water Leak Detection', 'Smart Smoke Detector'
            ]
        },
        sustainable: {
            icon: FaLeaf,
            title: 'Green Features',
            options: [
                'Energy Star Rated', 'Solar Ready', 'LED Lighting Package',
                'Low-VOC Materials', 'Sustainable Wood', 'Energy Efficient Windows',
                'Programmable Thermostat', 'Water-Saving Fixtures', 'Natural Ventilation'
            ]
        },
        kitchen: {
            icon: FaUtensils,
            title: 'Kitchen Features',
            options: [
                'Granite Countertops', 'Quartz Countertops', 'Marble Countertops',
                'Kitchen Island', 'Butler\'s Pantry', 'Custom Cabinets', 'Soft-close Cabinets',
                'Under-cabinet Lighting', 'Tile Backsplash', 'Stone Backsplash'
            ]
        },
        bathroom: {
            icon: FaBath,
            title: 'Bathroom Features',
            options: [
                'Double Vanity', 'Single Vanity', 'Floating Vanity', 'Walk-in Shower',
                'Glass Shower Doors', 'Tile Shower Surround', 'Steam Shower',
                'Soaking Tub', 'Jetted Tub', 'Heated Floors', 'Exhaust Fan'
            ]
        },
        bedroom: {
            icon: FaBed,
            title: 'Bedroom Features',
            options: [
                'Master Suite', 'En-suite Bathroom', 'Jack and Jill Bathroom',
                'Private Balcony', 'Dressing Area', 'Built-in Desk', 'Reading Area'
            ]
        },
        office: {
            icon: FaDesktop,
            title: 'Office Features',
            options: [
                'Built-in Desk', 'Built-in Bookshelves', 'File Storage',
                'Multiple Phone Lines', 'High-speed Internet Ready', 'Soundproofing'
            ]
        },
        utility: {
            icon: FaTools,
            title: 'Utility Features',
            options: [
                'Laundry Hookups', 'Utility Sink', 'Storage Shelving',
                'Workbench', 'Tool Storage', 'Mudroom Features'
            ]
        }
    };

    const toggleSection = (section: string) => {
        const newOpenSections = new Set(openSections);
        if (newOpenSections.has(section)) {
            newOpenSections.delete(section);
        } else {
            newOpenSections.add(section);
        }
        setOpenSections(newOpenSections);
    };

    const handleFeatureSelect = (category: string, option: string) => {
        const newFeature: Feature = {
            unit: null,
            value: option,
            name: category.charAt(0).toUpperCase() + category.slice(1),
        };

        setSelectedFeatures(prevFeatures => {
            const existingIndex = prevFeatures.findIndex(
                f => f.name === newFeature.name && f.value === newFeature.value
            );

            if (existingIndex >= 0) {
                return prevFeatures.filter((_, index) => index !== existingIndex);
            } else {
                return [...prevFeatures, newFeature];
            }
        });
    };

    const handleCustomFieldChange = (fieldName: string, value: string, unit: string) => {
        setCustomInputs(prev => ({
            ...prev,
            [fieldName]: { value, unit }
        }));

        if (value.trim()) {
            const newFeature: Feature = {
                name: fieldName,
                value: value.trim(),
                unit: unit === 'count' ? null : unit
            };

            setSelectedFeatures(prev => {
                const filtered = prev.filter(f => f.name !== fieldName);
                return [...filtered, newFeature];
            });
        } else {
            setSelectedFeatures(prev => prev.filter(f => f.name !== fieldName));
        }
    };

    const handleAmenityToggle = (amenity: string) => {
        setSelectedAmenities(prev => {
            if (prev.includes(amenity)) {
                return prev.filter(a => a !== amenity);
            } else {
                return [...prev, amenity];
            }
        });
    };

    useEffect(() => {
        setFormData((prev: any) => ({
            ...prev,
            features: selectedFeatures
        }));
    }, [selectedFeatures, setFormData]);

    useEffect(() => {
        setFormData((prev: any) => ({
            ...prev,
            amenities: selectedAmenities
        }));
    }, [selectedAmenities, setFormData]);

    const isFeatureSelected = (category: string, option: string) => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        return selectedFeatures.some(f => f.name === categoryName && f.value === option);
    };

    // const exportData = (): RoomFeaturesData => {
    //     return {
    //         features: selectedFeatures,
    //         amenities: selectedAmenities
    //     };
    // };

    const clearAll = () => {
        setSelectedFeatures([]);
        setSelectedAmenities([]);
        setCustomInputs({});
    };

    const renderFeatureCategory = (categoryKey: string, category: any) => {
        const IconComponent = category.icon;
        const isOpen = openSections.has(categoryKey);

        return (
            <div key={categoryKey} className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
                <button
                    onClick={() => toggleSection(categoryKey)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center space-x-2">
                        <IconComponent className="text-blue-600" />
                        <span className="font-medium text-gray-900">{category.title}</span>
                    </div>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {isOpen && (
                    <div className="p-4 bg-white">
                        {/* Custom Fields */}
                        {category.customFields && (
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.customFields.map((field: any) => (
                                    <div key={field.name} className="">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.name}
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={customInputs[field.name]?.value || ''}
                                                onChange={(e) => handleCustomFieldChange(
                                                    field.name,
                                                    e.target.value,
                                                    customInputs[field.name]?.unit || field.units[0]
                                                )}
                                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter value"
                                            />
                                            {field.units.length > 1 && (
                                                <select
                                                    value={customInputs[field.name]?.unit || field.units[0]}
                                                    onChange={(e) => handleCustomFieldChange(
                                                        field.name,
                                                        customInputs[field.name]?.value || '',
                                                        e.target.value
                                                    )}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {field.units.map((unit: string) => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Options */}
                        {category.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {category.options.map((option: string) => (
                                    <button
                                        key={option}
                                        onClick={() => handleFeatureSelect(categoryKey, option)}
                                        className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${isFeatureSelected(categoryKey, option)
                                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option}</span>
                                            {isFeatureSelected(categoryKey, option) && <FaCheck className="text-blue-600" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderAmenityCategory = (categoryKey: string, category: any) => {
        const IconComponent = category.icon;
        const isOpen = openSections.has(categoryKey);

        return (
            <div key={categoryKey} className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
                <button
                    onClick={() => toggleSection(categoryKey)}
                    className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center space-x-2">
                        <IconComponent className="text-green-600" />
                        <span className="font-medium text-gray-900">{category.title}</span>
                    </div>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {isOpen && (
                    <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                            {category.options.map((option: string) => (
                                <button
                                    key={option}
                                    onClick={() => handleAmenityToggle(option)}
                                    className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${selectedAmenities.includes(option)
                                        ? 'bg-green-100 border-green-500 text-green-800'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        {selectedAmenities.includes(option) && <FaCheck className="text-green-600" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mx-auto">
            <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Room Features & Amenities Selector</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={clearAll}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
                        >
                            <FaTimes />
                            <span>Clear All</span>
                        </button>
                        {/* <button
                            onClick={() => console.log(JSON.stringify(exportData(), null, 2))}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Export Data
                        </button> */}
                    </div>
                </div>

                {/* Summary */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Selected Features ({selectedFeatures.length})</h3>
                        <div className="text-sm text-gray-600 max-h-20 overflow-y-auto">
                            {selectedFeatures.length === 0 ? 'None selected' :
                                selectedFeatures.map(f => `${f.name}: ${f.value}${f.unit ? ` ${f.unit}` : ''}`).join(', ')
                            }
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Selected Amenities ({selectedAmenities.length})</h3>
                        <div className="text-sm text-gray-600 max-h-20 overflow-y-auto">
                            {selectedAmenities.length === 0 ? 'None selected' : selectedAmenities.join(', ')}
                        </div>
                    </div>
                </div> */}

                {/* Features Section */}
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FaHome className="mr-2 text-blue-600" />
                        Room Features
                    </h2>
                    {Object.entries(featureCategories).map(([key, category]) =>
                        renderFeatureCategory(key, category)
                    )}
                </div>

                {/* Amenities Section */}
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FaStar className="mr-2 text-green-600" />
                        Amenities
                    </h2>
                    {Object.entries(amenityCategories).map(([key, category]) =>
                        renderAmenityCategory(key, category)
                    )}
                </div>

                {/* Export Preview */}
                {/* <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Export Preview:</h3>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(exportData(), null, 2)}
                    </pre>
                </div> */}
            </div>
        </div>
    );
};

export default RoomFeaturesSelector;