"use client";

import Image from "next/image";
import { toast } from "react-toastify";
import { useState, useRef, useCallback } from "react";
import {
    IoAdd,
    IoTime,
    IoImage,
    IoClose,
    IoWarning,
    IoArchive,
    IoDocument,
    IoVideocam,
    IoCloudUpload,
    IoMusicalNotes,
    IoCheckmarkCircle,
} from "react-icons/io5";

interface FileItem {
    id: string;
    file: File;
    url: string;
    progress: number;
    preview?: string;
    uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
    type: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other';
}

interface AdvancedFileUploadProps {
    data?: FileItem[] | FileItem | null;
    setState: (updater: (prev: any) => any) => void;
    fieldname?: string;
    maxFiles?: number;
    maxSizeInMB?: number;
    allowedTypes?: string[];
    showPreview?: boolean;
    multiple?: boolean;
    dragAndDrop?: boolean;
}

const AdvancedFileUpload = ({
    data,
    setState,
    fieldname = "files",
    maxFiles = 10,
    maxSizeInMB = 50,
    allowedTypes = [
        // Images
        "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml",
        // Videos
        "video/mp4", "video/avi", "video/mov", "video/wmv", "video/mkv", "video/webm",
        // Documents
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv", "application/rtf",
        // Audio
        "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/flac",
        // Archives
        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
        // Other
        "application/json", "application/xml", "text/html", "text/css", "text/javascript"
    ],
    showPreview = true,
    multiple = true,
    dragAndDrop = true,
}: AdvancedFileUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>(
        Array.isArray(data) ? data : data ? [data] : []
    );
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const getFileType = (file: File): FileItem['type'] => {
        const type = file.type.toLowerCase();
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';
        if (type.includes('pdf') || type.includes('doc') || type.includes('sheet') || type.includes('presentation') || type.includes('text')) return 'document';
        return 'other';
    };

    const getFileIcon = (type: FileItem['type'], size: number = 40) => {
        const iconProps = { size, className: "text-gray-500" };
        switch (type) {
            case 'image': return <IoImage {...iconProps} className="text-blue-500" />;
            case 'video': return <IoVideocam {...iconProps} className="text-red-500" />;
            case 'audio': return <IoMusicalNotes {...iconProps} className="text-green-500" />;
            case 'document': return <IoDocument {...iconProps} className="text-orange-500" />;
            case 'archive': return <IoArchive {...iconProps} className="text-purple-500" />;
            default: return <IoDocument {...iconProps} />;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: File): boolean => {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
            toast.error(`File "${file.name}" exceeds ${maxSizeInMB}MB limit`);
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            toast.error(`File type "${file.type}" is not supported`);
            return false;
        }

        return true;
    };

    const simulateUpload = (fileId: string): Promise<void> => {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            }, 200);
        });
    };

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);

        if (!multiple && fileArray.length > 1) {
            toast.warning("Multiple files not allowed");
            return;
        }

        if (selectedFiles.length + fileArray.length > maxFiles) {
            toast.warning(`Maximum ${maxFiles} files allowed`);
            return;
        }

        const validFiles = fileArray.filter(validateFile);

        if (validFiles.length === 0) return;

        const newFiles: FileItem[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            url: URL.createObjectURL(file),
            type: getFileType(file),
            uploadStatus: 'uploading',
            progress: 0,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);

        // Simulate upload process
        for (const fileItem of newFiles) {
            try {
                await simulateUpload(fileItem.id);
                setSelectedFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, uploadStatus: 'success' as const, progress: 100 } : f
                ));
            } catch (error) {
                setSelectedFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, uploadStatus: 'error' as const } : f
                ));
                console.log(error)
            }
        }

        // Update parent state
        const updatedFiles = multiple ? [...selectedFiles, ...newFiles] : newFiles;
        setState((prev: any) => ({
            ...prev,
            [fieldname]: multiple ? updatedFiles.map(f => f.file) : newFiles[0]?.file
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFiles, multiple, maxFiles, fieldname, setState]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            processFiles(files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (dragAndDrop) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (dragAndDrop) {
            const files = e.dataTransfer.files;
            if (files) {
                processFiles(files);
            }
        }
    };

    const removeFile = (fileId: string) => {
        setSelectedFiles(prev => {
            const updated = prev.filter(f => f.id !== fileId);
            setState((prevState: any) => ({
                ...prevState,
                [fieldname]: multiple ? updated.map(f => f.file) : null
            }));
            return updated;
        });
    };

    const getStatusIcon = (status: FileItem['uploadStatus']) => {
        switch (status) {
            case 'success': return <IoCheckmarkCircle className="text-green-500" size={20} />;
            case 'error': return <IoWarning className="text-red-500" size={20} />;
            case 'uploading': return <IoTime className="text-blue-500 animate-spin" size={20} />;
            default: return null;
        }
    };

    return (
        <div className="w-full space-y-4">
            <input
                type="file"
                accept={allowedTypes.join(',')}
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                multiple={multiple}
            />

            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col justify-center items-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >
                <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="p-3 bg-gray-100 rounded-full">
                        <IoCloudUpload size={40} className="text-gray-600" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {dragAndDrop ? 'Drop files here or click to upload' : 'Click to upload files'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {multiple ? `Up to ${maxFiles} files` : 'Single file only'} • Max {maxSizeInMB}MB {multiple && "each"}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                            <IoImage size={16} className="text-blue-500" /> Images
                        </span>
                        <span className="flex items-center gap-1">
                            <IoVideocam size={16} className="text-red-500" /> Videos
                        </span>
                        <span className="flex items-center gap-1">
                            <IoDocument size={16} className="text-orange-500" /> Documents
                        </span>
                        <span className="flex items-center gap-1">
                            <IoMusicalNotes size={16} className="text-green-500" /> Audio
                        </span>
                        <span className="flex items-center gap-1">
                            <IoArchive size={16} className="text-purple-500" /> Archives
                        </span>
                    </div>
                </div>

                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">
                            Drop files here
                        </div>
                    </div>
                )}
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                        Uploaded Files ({selectedFiles.length})
                    </h4>

                    <div className="grid gap-3">
                        {selectedFiles.map((fileItem) => (
                            <div
                                key={fileItem.id}
                                className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                {/* File Icon/Preview */}
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                    {showPreview && fileItem.preview ? (
                                        <Image
                                            src={fileItem.preview}
                                            alt={fileItem.file.name}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 object-cover rounded-lg"
                                        />
                                    ) : (
                                        getFileIcon(fileItem.type, 32)
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0 ml-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-medium text-gray-900 truncate">
                                            {fileItem.file.name}
                                        </h5>
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(fileItem.uploadStatus)}
                                            <button
                                                onClick={() => removeFile(fileItem.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <IoClose size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500">
                                            {formatFileSize(fileItem.file.size)} • {fileItem.type}
                                        </span>

                                        {fileItem.uploadStatus === 'uploading' && (
                                            <span className="text-xs text-blue-600">
                                                {Math.round(uploadProgress[fileItem.id] || 0)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    {fileItem.uploadStatus === 'uploading' && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add More Button */}
            {multiple && selectedFiles.length > 0 && selectedFiles.length < maxFiles && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                    <IoAdd size={20} />
                    <span>Add More Files</span>
                </button>
            )}
        </div>
    );
};

export default AdvancedFileUpload;