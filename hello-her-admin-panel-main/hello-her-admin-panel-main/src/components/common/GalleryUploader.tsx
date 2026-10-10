"use client";

import Modal from "./Modal";
import Image from "next/image";
import { makeFormData } from "@/hooks/formData";
import { FaImage, FaVideo } from "react-icons/fa";
import { Delete, Fetch, Post, Put } from "@/hooks/apiUtils";
import React, { useCallback, useEffect, useState } from "react";
import { Upload, Trash2, Plus, Grid, Search, X, Check, ArrowUp, ArrowDown, Edit } from "lucide-react";

interface GalleryUploaderProps {
    roomId?: string;
    propertyId?: string;
}

interface GalleryItem {
    _id: string;
    url: string;
    order: number;
    tags: string[];
    type: "image" | "video" | "virtual_tour" | "360_view";
    category: "exterior" | "interior" | "room" | "amenity" | "neighborhood";
}

interface FileWithSettings {
    file: File;
    id: string;
    tags: string;
    order: number;
    preview?: string;
    category: string;
    uploaded: boolean;
    uploading: boolean;
}

const GalleryUploader: React.FC<GalleryUploaderProps> = ({
    roomId,
    propertyId,
}) => {
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [tab, setTab] = useState<"all" | "upload">("all");
    const [editingFile, setEditingFile] = useState<any>(null);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [filterCategory, setFilterCategory] = useState("all");
    const [filesWithSettings, setFilesWithSettings] = useState<FileWithSettings[]>([]);

    const fetchGallery = useCallback(async () => {
        try {
            const response: any = await Fetch(
                "/api/gallery",
                { propertyId, roomId, limit: 1000 },
                5000,
                true,
                false
            );

            if (response?.success) {
                let results = response?.data?.result || [];
                if (propertyId && !roomId) {
                    results = results.filter(
                        (item: any) => !(item.roomId && item.propertyId)
                    );
                }
                setGallery(results);
            }
        } catch (error) {
            console.log("Error: ", error);
        }
    }, [propertyId, roomId]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const createFilePreview = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                resolve('');
            }
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newFilesWithSettings: FileWithSettings[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const preview = await createFilePreview(file);
                const maxOrder = Math.max(0, ...filesWithSettings.map(f => f.order), ...gallery.map(g => g.order));

                newFilesWithSettings.push({
                    file,
                    id: generateId(),
                    category: "room",
                    order: maxOrder + i + 1,
                    tags: "",
                    uploading: false,
                    uploaded: false,
                    preview
                });
            }

            setFilesWithSettings([...filesWithSettings, ...newFilesWithSettings]);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const newFilesWithSettings: FileWithSettings[] = [];

        for (let i = 0; i < droppedFiles.length; i++) {
            const file = droppedFiles[i];
            const preview = await createFilePreview(file);
            const maxOrder = Math.max(0, ...filesWithSettings.map(f => f.order), ...gallery.map(g => g.order));

            newFilesWithSettings.push({
                file,
                id: generateId(),
                category: "room",
                order: maxOrder + i + 1,
                tags: "",
                uploading: false,
                uploaded: false,
                preview
            });
        }

        setFilesWithSettings([...filesWithSettings, ...newFilesWithSettings]);
    };

    const removeFile = (id: string) => {
        setFilesWithSettings(filesWithSettings.filter(f => f.id !== id));
    };

    const updateFileSettings = (id: string, field: keyof FileWithSettings, value: any) => {
        setFilesWithSettings(filesWithSettings.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const moveFile = (id: string, direction: 'up' | 'down') => {
        const index = filesWithSettings.findIndex(f => f.id === id);
        if (index === -1) return;

        const newFiles = [...filesWithSettings];
        if (direction === 'up' && index > 0) {
            [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
        } else if (direction === 'down' && index < newFiles.length - 1) {
            [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        }
        setFilesWithSettings(newFiles);
    };

    const uploadSingleFile = async (fileWithSettings: FileWithSettings) => {
        updateFileSettings(fileWithSettings.id, "uploading", true);
        try {
            const data: any = { ...fileWithSettings };
            data.url = data.file;
            if (roomId) data.roomId = roomId;
            if (propertyId) data.propertyId = propertyId;
            data.type = data.file.type.split("/")[0];
            delete data.id;
            delete data.file;
            delete data.preview;
            delete data.uploaded;
            delete data.uploading;

            const formData = makeFormData(data);
            await Post("/api/gallery", formData);

            // success → update states
            updateFileSettings(fileWithSettings.id, "uploading", false);
            updateFileSettings(fileWithSettings.id, "uploaded", true);
        } catch (error) {
            console.log("❌ Upload Error:", error);

            // mark failed
            updateFileSettings(fileWithSettings.id, "uploading", false);
            updateFileSettings(fileWithSettings.id, "uploaded", false);
        }
    };

    const updateGalleryImage = async () => {
        try {
            setLoading(true);
            const data = {
                _id: editingFile._id,
                tags: editingFile.tags,
                order: editingFile.order,
                category: editingFile.category,
            }
            const formData = makeFormData(data);
            const response: any = await Put("/api/gallery/" + data?._id, formData);
            if (response?.success) {
                setEditingFile(null);
                await fetchGallery();
            }
        } catch (error) {
            console.log("❌ Upload Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response: any = await Delete("/api/gallery/" + id);
            if (response?.success) fetchGallery();
        } catch (error) {
            console.log("Error: ", error);
        }
    };

    const filteredGallery = gallery.filter(item => {
        const matchesSearch = item.tags.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) || item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ["all", "exterior", "interior", "room", "amenity", "neighborhood"];
    const uploadedCount = filesWithSettings.filter(f => f.uploaded).length;
    const uploadingCount = filesWithSettings.filter(f => f.uploading).length;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">Media Gallery</h1>
                <p className="text-gray-600">Manage your property photos and videos</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        className={`px-6 py-2 rounded-md transition-all duration-200 font-medium ${tab === "all"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setTab("all")}
                    >
                        <div className="flex items-center space-x-2">
                            <Grid size={16} />
                            <span>All Media</span>
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                                {gallery.length}
                            </span>
                        </div>
                    </button>
                    <button
                        className={`px-6 py-2 rounded-md transition-all duration-200 font-medium ${tab === "upload"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setTab("upload")}
                    >
                        <div className="flex items-center space-x-2">
                            <Plus size={16} />
                            <span>Upload New</span>
                            {filesWithSettings.length > 0 && (
                                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                                    {filesWithSettings.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* All Files Tab */}
            {tab === "all" && (
                <div>
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by tags or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                        {filteredGallery.map((item) => (
                            <div
                                key={item._id}
                                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                                    {item.type === "image" ? (
                                        <Image
                                            width={400}
                                            height={400}
                                            alt="gallery"
                                            src={item.url}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                                            <FaVideo className="text-white" size={32} />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={() => setEditingFile(item)}
                                                className="p-2 bg-red-500 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <Edit size={16} className="text-white" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="p-2 bg-red-500 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} className="text-white" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="absolute top-3 left-3">
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${item.type === "image"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-purple-100 text-purple-700"
                                            }`}>
                                            {item.type === "image" ? <FaImage size={12} /> : <FaVideo size={12} />}
                                            <span className="capitalize">{item.type}</span>
                                        </div>
                                    </div>

                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 bg-black bg-opacity-70 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {item.order}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-3 absolute bottom-0 left-0 bg-black/40 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white capitalize">
                                            {item.category}
                                        </span>
                                    </div>
                                    {item.tags.length > 2 &&
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                                <span
                                                    key={tagIndex}
                                                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {item.tags.length > 3 && (
                                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                                                    +{item.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredGallery.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Tab */}
            {tab === "upload" && (
                <div className="space-y-6">
                    {/* Upload Progress Summary */}
                    {filesWithSettings.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-blue-900">Upload Progress</h3>
                                <div className="text-sm text-blue-700">
                                    {uploadedCount}/{filesWithSettings.length} completed
                                </div>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${filesWithSettings.length > 0 ? (uploadedCount / filesWithSettings.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                            {uploadingCount > 0 && (
                                <p className="text-sm text-blue-700 mt-2">
                                    {uploadingCount} file{uploadingCount > 1 ? 's' : ''} uploading...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Drag & Drop Zone */}
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragOver
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                            }`}
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <div className="space-y-4">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${dragOver ? "bg-blue-100" : "bg-gray-100"
                                }`}>
                                <Upload className={`${dragOver ? "text-blue-600" : "text-gray-400"}`} size={24} />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Drop files here or click to browse
                                </h3>
                                <p className="text-gray-500">
                                    Support for JPG, PNG, GIF, MP4, MOV up to 10MB each
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Individual File Cards */}
                    {filesWithSettings.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Files Ready for Upload ({filesWithSettings.length})
                                </h4>
                            </div>

                            {filesWithSettings.map((fileWithSettings, index) => (
                                <div key={fileWithSettings.id} className="bg-white border rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        {/* File Preview */}
                                        <div className="flex-shrink-0">
                                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                                {fileWithSettings.preview ? (
                                                    <Image
                                                        width={400}
                                                        height={400}
                                                        src={fileWithSettings.preview}
                                                        alt={fileWithSettings.file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {fileWithSettings.file.type.startsWith("video") ? (
                                                            <FaVideo className="text-purple-500" size={24} />
                                                        ) : (
                                                            <FaImage className="text-green-500" size={24} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* File Details and Settings */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h5 className="font-medium text-gray-900 truncate">
                                                        {fileWithSettings.file.name}
                                                    </h5>
                                                    <p className="text-sm text-gray-500">
                                                        {(fileWithSettings.file.size / 1024 / 1024).toFixed(1)} MB • {fileWithSettings.file.type.split('/')[1].toUpperCase()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {/* Move buttons */}
                                                    <button
                                                        onClick={() => moveFile(fileWithSettings.id, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveFile(fileWithSettings.id, 'down')}
                                                        disabled={index === filesWithSettings.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>

                                                    {/* Status */}
                                                    {fileWithSettings.uploaded && (
                                                        <div className="flex items-center text-green-600">
                                                            <Check size={16} />
                                                            <span className="text-xs ml-1">Uploaded</span>
                                                        </div>
                                                    )}

                                                    {fileWithSettings.uploading && (
                                                        <div className="flex items-center text-blue-600">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                                            <span className="text-xs ml-1">Uploading</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => removeFile(fileWithSettings.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Settings Form */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Category
                                                    </label>
                                                    <select
                                                        value={fileWithSettings.category}
                                                        onChange={(e) => updateFileSettings(fileWithSettings.id, 'category', e.target.value)}
                                                        disabled={fileWithSettings.uploaded || fileWithSettings.uploading}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                                    >
                                                        <option value="room">Room</option>
                                                        <option value="exterior">Exterior</option>
                                                        <option value="interior">Interior</option>
                                                        <option value="amenity">Amenity</option>
                                                        <option value="neighborhood">Neighborhood</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Order
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={fileWithSettings.order}
                                                        onChange={(e) => updateFileSettings(fileWithSettings.id, 'order', Number(e.target.value))}
                                                        disabled={fileWithSettings.uploaded || fileWithSettings.uploading}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                                        min="0"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Tags
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={fileWithSettings.tags}
                                                        onChange={(e) => updateFileSettings(fileWithSettings.id, 'tags', e.target.value)}
                                                        disabled={fileWithSettings.uploaded || fileWithSettings.uploading}
                                                        placeholder="e.g. bedroom, balcony, modern"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                                    />
                                                </div>
                                            </div>

                                            {/* Individual Upload Button */}
                                            {!fileWithSettings.uploaded && !fileWithSettings.uploading && (
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        onClick={() => uploadSingleFile(fileWithSettings)}
                                                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                                    >
                                                        <Upload size={14} />
                                                        <span>Upload This File</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {editingFile &&
                <Modal width="lg:w-1/3" isVisible={editingFile?._id} onClose={() => setEditingFile(null)}>
                    <div className="flex flex-col items-start gap-4">
                        {/* File Preview */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                {editingFile?.url ? (
                                    <Image
                                        width={400}
                                        height={400}
                                        src={editingFile?.url}
                                        alt={editingFile?.type}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {editingFile?.type === "image" ? (
                                            <FaVideo className="text-purple-500" size={24} />
                                        ) : (
                                            <FaImage className="text-green-500" size={24} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* File Details and Settings */}
                        <div className="flex-1 w-full">
                            {/* Settings Form */}
                            <div className="grid grid-cols-1 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={editingFile?.category}
                                        disabled={editingFile?.uploaded || editingFile?.uploading}
                                        onChange={(e) => setEditingFile((prev: any) => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                    >
                                        <option value="room">Room</option>
                                        <option value="amenity">Amenity</option>
                                        <option value="exterior">Exterior</option>
                                        <option value="interior">Interior</option>
                                        <option value="neighborhood">Neighborhood</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Order
                                    </label>
                                    <input
                                        min="0"
                                        type="number"
                                        value={editingFile?.order}
                                        disabled={editingFile?.uploaded || editingFile?.uploading}
                                        onChange={(e) => setEditingFile((prev: any) => ({ ...prev, order: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. bedroom, balcony, modern"
                                        disabled={editingFile?.uploaded || editingFile?.uploading}
                                        onChange={(e) => setEditingFile((prev: any) => ({ ...prev, tags: e.target.value }))}
                                        value={Array.isArray(editingFile?.tags) ? editingFile?.tags.join(", ") : editingFile?.tags}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    disabled={loading}
                                    onClick={updateGalleryImage}
                                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                >
                                    <span>Update</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            }
        </div>
    );
};

export default GalleryUploader;