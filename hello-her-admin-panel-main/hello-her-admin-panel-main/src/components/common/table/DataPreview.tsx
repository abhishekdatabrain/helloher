"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import {
    FiChevronRight,
    FiChevronDown,
    FiCopy,
    FiSearch,
    FiEye,
    FiEyeOff,
    FiCalendar,
    FiImage,
    FiHash,
    FiType,
    FiToggleLeft,
    FiToggleRight,
    FiList,
    FiBox,
    FiLink,
    FiMail,
    FiPhone,
    FiGlobe,
    FiCode,
    FiMaximize2,
    FiAlertCircle,
    FiZap,
    FiHeart,
    FiDatabase,
    FiLayers,
    FiClock,
    FiFileText,
    FiWifi,
    FiDollarSign,
    FiPieChart,
    FiInfo,
    FiKey,
    FiSun,
} from "react-icons/fi";
import Image from "next/image";

interface DataPreviewProps {
    title?: string;
    maxDepth?: number;
    enableCopy?: boolean;
    enableSearch?: boolean;
    enableFilter?: boolean;
    data: Record<string, any>;
    theme?: 'light' | 'dark' | 'glassmorphism';
}

const formatKey = (key: string) =>
    key
        .replace(/[_\-]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const detectDataType = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
    if (typeof value === 'string') {
        // URL detection
        if (/^https?:\/\//.test(value)) return 'url';
        // Email detection
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
        // Phone detection
        if (/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) return 'phone';
        // Date detection (enhanced with dayjs)
        if (isValidDate(value)) return 'date';
        // Image detection
        if (/\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff)$/i.test(value)) return 'image';
        // JSON string detection
        try {
            JSON.parse(value);
            return 'json';
        } catch { }
        // Base64 detection
        if (/^data:/.test(value)) return 'base64';
        // UUID detection
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
        // HTML detection
        if (/<[^>]+>/.test(value)) return 'html';
        // Credit card detection
        if (/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(value)) return 'creditcard';
        // IP address detection
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return 'ip';
        // Color hex detection
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) return 'color';
        // Large text detection
        if (value.length > 200) return 'longtext';
        return 'string';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'function') return 'function';
    return 'unknown';
};

const isValidDate = (val: any): boolean => {
    if (typeof val !== 'string') return false;
    const date = dayjs(val);
    return date.isValid() && val.length > 8;
};

const getTypeIcon = (type: string) => {
    const iconMap: any = {
        'string': FiType,
        'integer': FiHash,
        'float': FiHash,
        'boolean': FiToggleLeft,
        'array': FiList,
        'object': FiBox,
        'null': FiAlertCircle,
        'date': FiCalendar,
        'image': FiImage,
        'url': FiLink,
        'email': FiMail,
        'phone': FiPhone,
        'json': FiCode,
        'base64': FiDatabase,
        'uuid': FiKey,
        'html': FiGlobe,
        'creditcard': FiDollarSign,
        'ip': FiWifi,
        'color': FiSun,
        'longtext': FiFileText,
        'function': FiZap,
        'unknown': FiAlertCircle
    };
    return iconMap[type] || FiInfo;
};

const getTypeColor = (type: string) => {
    const colorMap: any = {
        'string': 'text-blue-600 bg-blue-50',
        'integer': 'text-green-600 bg-green-50',
        'float': 'text-emerald-600 bg-emerald-50',
        'boolean': 'text-purple-600 bg-purple-50',
        'array': 'text-orange-600 bg-orange-50',
        'object': 'text-indigo-600 bg-indigo-50',
        'null': 'text-gray-600 bg-gray-50',
        'date': 'text-pink-600 bg-pink-50',
        'image': 'text-cyan-600 bg-cyan-50',
        'url': 'text-blue-700 bg-blue-100',
        'email': 'text-red-600 bg-red-50',
        'phone': 'text-yellow-600 bg-yellow-50',
        'json': 'text-slate-600 bg-slate-50',
        'base64': 'text-violet-600 bg-violet-50',
        'uuid': 'text-teal-600 bg-teal-50',
        'html': 'text-rose-600 bg-rose-50',
        'creditcard': 'text-amber-600 bg-amber-50',
        'ip': 'text-sky-600 bg-sky-50',
        'color': 'text-lime-600 bg-lime-50',
        'longtext': 'text-stone-600 bg-stone-50',
        'function': 'text-fuchsia-600 bg-fuchsia-50',
        'unknown': 'text-gray-600 bg-gray-50'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-50';
};

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

const formatValue = (value: any, type: string) => {
    switch (type) {
        case 'date':
            return dayjs(value).format('MMM DD, YYYY [at] HH:mm');
        case 'creditcard':
            return value.replace(/(\d{4})/g, '$1 ').trim();
        case 'longtext':
            return value.length > 100 ? value.substring(0, 100) + '...' : value;
        case 'color':
            return value.toUpperCase();
        case 'function':
            return value.toString().substring(0, 50) + '...';
        default:
            return String(value);
    }
};

const ValueRenderer = ({ value, type, depth = 0, maxDepth = 3 }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullText, setShowFullText] = useState(false);
    const [imageError, setImageError] = useState(false);

    const IconComponent = getTypeIcon(type);
    const colorClass = getTypeColor(type);

    if (value === null || value === undefined) {
        return (
            <div className="flex items-center gap-2">
                <FiAlertCircle className="text-gray-400" size={16} />
                <span className="text-gray-400 italic font-medium">null</span>
            </div>
        );
    }

    if (type === 'boolean') {
        return (
            <div className="flex items-center gap-2">
                {value ? (
                    <FiToggleRight className="text-green-600" size={18} />
                ) : (
                    <FiToggleLeft className="text-red-600" size={18} />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {value ? 'True' : 'False'}
                </span>
            </div>
        );
    }

    if (type === 'image') {
        return (
            <div className="flex items-center gap-3">
                <FiImage className="text-cyan-600" size={16} />
                {!imageError ? (
                    <div className="relative group">
                        <Image
                            width={100}
                            height={100}
                            src={value}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-xl border-2 border-cyan-200 shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer"
                            onError={() => setImageError(true)}
                            onClick={() => window.open(value, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
                            <FiMaximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={20} />
                        </div>
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <FiImage className="text-gray-400" size={24} />
                    </div>
                )}
                <span className="text-sm text-gray-600 font-mono">{value}</span>
            </div>
        );
    }

    if (type === 'url') {
        return (
            <div className="flex items-center gap-2">
                <FiLink className="text-blue-600" size={16} />
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                >
                    {value}
                </a>
                <button
                    onClick={() => copyToClipboard(value)}
                    className="p-1 hover:bg-blue-50 rounded transition-colors duration-200"
                    title="Copy URL"
                >
                    <FiCopy size={14} className="text-blue-600" />
                </button>
            </div>
        );
    }

    if (type === 'email') {
        return (
            <div className="flex items-center gap-2">
                <FiMail className="text-red-600" size={16} />
                <a
                    href={`mailto:${value}`}
                    className="text-red-600 hover:text-red-800 hover:underline font-medium transition-colors duration-200"
                >
                    {value}
                </a>
                <button
                    onClick={() => copyToClipboard(value)}
                    className="p-1 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Copy email"
                >
                    <FiCopy size={14} className="text-red-600" />
                </button>
            </div>
        );
    }

    if (type === 'phone') {
        return (
            <div className="flex items-center gap-2">
                <FiPhone className="text-yellow-600" size={16} />
                <a
                    href={`tel:${value}`}
                    className="text-yellow-600 hover:text-yellow-800 hover:underline font-medium transition-colors duration-200"
                >
                    {value}
                </a>
                <button
                    onClick={() => copyToClipboard(value)}
                    className="p-1 hover:bg-yellow-50 rounded transition-colors duration-200"
                    title="Copy phone"
                >
                    <FiCopy size={14} className="text-yellow-600" />
                </button>
            </div>
        );
    }

    if (type === 'color') {
        return (
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: value }}
                />
                <span className="font-mono text-sm text-gray-700">{value.toUpperCase()}</span>
                <button
                    onClick={() => copyToClipboard(value)}
                    className="p-1 hover:bg-gray-50 rounded transition-colors duration-200"
                    title="Copy color"
                >
                    <FiCopy size={14} className="text-gray-600" />
                </button>
            </div>
        );
    }

    if (type === 'date') {
        const date = dayjs(value);
        return (
            <div className="flex items-center gap-2">
                <FiCalendar className="text-pink-600" size={16} />
                <div className="flex flex-col">
                    <span className="text-pink-700 font-medium">
                        {date.format('MMM DD, YYYY')}
                    </span>
                    <span className="text-pink-600 text-sm">
                        {date.format('HH:mm')} • {date.fromNow()}
                    </span>
                </div>
            </div>
        );
    }

    if (type === 'longtext') {
        return (
            <div className="flex items-start gap-2">
                <FiFileText className="text-stone-600 mt-1" size={16} />
                <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed">
                        {showFullText ? value : value.substring(0, 200) + '...'}
                    </p>
                    {value.length > 200 && (
                        <button
                            onClick={() => setShowFullText(!showFullText)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center gap-1"
                        >
                            {showFullText ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            {showFullText ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (type === 'array') {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200"
                    >
                        {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                        <FiList size={16} />
                        Array ({value.length} items)
                    </button>
                </div>
                <AnimatePresence>
                    {isExpanded && depth < maxDepth && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-6 space-y-3 border-l-2 border-orange-200 pl-4"
                        >
                            {value.slice(0, 10).map((item: any, idx: number) => {
                                const itemType = detectDataType(item);
                                return (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-orange-600 font-mono text-sm min-w-[24px]">
                                            {idx}
                                        </span>
                                        <ValueRenderer
                                            value={item}
                                            type={itemType}
                                            depth={depth + 1}
                                            maxDepth={maxDepth}
                                        />
                                    </div>
                                );
                            })}
                            {value.length > 10 && (
                                <div className="text-orange-600 text-sm font-medium">
                                    ... and {value.length - 10} more items
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (type === 'object') {
        const entries = Object.entries(value);
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                    >
                        {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                        <FiBox size={16} />
                        Object ({entries.length} properties)
                    </button>
                </div>
                <AnimatePresence>
                    {isExpanded && depth < maxDepth && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-6 space-y-3 border-l-2 border-indigo-200 pl-4"
                        >
                            {entries.map(([key, val], idx) => {
                                const valType = detectDataType(val);
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-indigo-700 font-semibold text-sm">
                                                {formatKey(key)}:
                                            </span>
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${colorClass}`}>
                                                {valType}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <ValueRenderer
                                                value={val}
                                                type={valType}
                                                depth={depth + 1}
                                                maxDepth={maxDepth}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <IconComponent className={colorClass.split(' ')[0]} size={16} />
            <span className="text-gray-700 font-medium">
                {formatValue(value, type)}
            </span>
            {(type === 'string' || type === 'integer' || type === 'float') && (
                <button
                    onClick={() => copyToClipboard(String(value))}
                    className="p-1 hover:bg-gray-50 rounded transition-colors duration-200"
                    title="Copy value"
                >
                    <FiCopy size={12} className="text-gray-500" />
                </button>
            )}
        </div>
    );
};

const DataPreview: React.FC<DataPreviewProps> = ({
    data,
    maxDepth = 5,
    theme = 'light',
    enableCopy = true,
    title = "Data Overview",
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const dataEntries = useMemo(() => {
        const entries = Object.entries(data).map(([key, value]) => ({
            key,
            value,
            type: detectDataType(value),
            formattedKey: formatKey(key)
        }));
        return entries;
    }, [data]);

    const typeStats = useMemo(() => {
        const stats: any = {};
        Object.values(data).forEach(value => {
            const type = detectDataType(value);
            stats[type] = (stats[type] || 0) + 1;
        });
        return stats;
    }, [data]);

    const themeClasses = {
        light: 'bg-white border-gray-200',
        dark: 'bg-gray-900 border-gray-700 text-white',
        glassmorphism: 'bg-white/10 backdrop-blur-xl border-white/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className={`${themeClasses[theme]}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                        <FiDatabase className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {title}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {Object.keys(data).length} properties • {Object.keys(typeStats).length} data types
                        </p>
                    </div>
                </div>
            </div>

            {/* Type Statistics */}
            <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-500 my-3 flex items-center gap-2">
                    <FiPieChart size={20} />
                    Data Types Distribution
                </h3>
                <div className="flex flex-wrap text-black gap-2">
                    {Object.entries(typeStats).map(([type, count]: any) => {
                        const IconComponent = getTypeIcon(type);
                        const colorClass = getTypeColor(type);
                        return (
                            <motion.div
                                key={type}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full border ${colorClass} cursor-pointer hover:scale-105 transition-transform duration-200`}
                                onClick={() => setFilterType(filterType === type ? 'all' : type)}
                            >
                                <IconComponent size={14} />
                                <span className="text-sm font-medium">{type}</span>
                                <span className="text-sm bg-white/50 px-2 py-1 rounded-full">{count}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            {/* Data Entries */}
            <div className="gap-2 grid grid-cols-1 lg:grid-cols-3">
                <AnimatePresence>
                    {dataEntries.map(({ key, value, type, formattedKey }, index) => (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className={`group border border-gray-200 rounded-2xl p-2 transition-all duration-300`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h4 className="text-base font-semibold text-gray-800">
                                            {formattedKey}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTypeColor(type)}`}>
                                            {type}
                                        </span>
                                    </div>
                                    <ValueRenderer
                                        value={value}
                                        type={type}
                                        depth={0}
                                        maxDepth={maxDepth}
                                    />
                                </div>

                                {enableCopy && (
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                        title="Copy value"
                                    >
                                        <FiCopy size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {dataEntries.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-12"
                >
                    <FiSearch className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-base font-semibold text-gray-600 mb-2">No data found</h3>
                    <p className="text-gray-500">
                        {searchQuery || filterType !== 'all'
                            ? "Try adjusting your search or filter criteria"
                            : "No data available to display"
                        }
                    </p>
                    {(searchQuery || filterType !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterType('all');
                            }}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                            Clear filters
                        </button>
                    )}
                </motion.div>
            )}

            {/* Footer Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <FiLayers size={14} />
                            Showing {dataEntries.length} of {Object.keys(data).length} properties
                        </span>
                        <span className="flex items-center gap-1">
                            <FiClock size={14} />
                            Updated {dayjs().format('HH:mm')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Made with</span>
                        <FiHeart className="text-red-500" size={12} />
                        <span className="text-sm text-gray-500">by Wayone</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DataPreview;