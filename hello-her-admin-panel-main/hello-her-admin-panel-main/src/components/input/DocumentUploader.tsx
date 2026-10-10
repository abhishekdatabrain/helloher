"use client";

import { toast } from "react-toastify";
import { IoCloudUpload } from "react-icons/io5";
import { MdPictureAsPdf } from "react-icons/md";
import { MdOutlineOpenInNew } from "react-icons/md";
import React, { FC, useState, useRef } from "react";
import { formatCompactNumber } from "@/hooks/general";

interface DocumentUploaderProps {
    field: {
        name: string;
        label: string;
        value?: string;
        required?: boolean;
        accept?: string;
    };
    setFormData: (newState: any) => void;
}

const DocumentUploader: FC<DocumentUploaderProps> = ({
    field,
    setFormData,
}) => {
    const fieldname = field?.name;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(
        field.value ?? null
    );
    const [, setIsDocument] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Initialize document preview state when value is provided (editing mode)
    React.useEffect(() => {
        if (field.value && typeof field.value === "string") {
            const lower = field.value.toLowerCase();
            if (lower.endsWith(".pdf") || lower.startsWith("http")) {
                setIsDocument(true);
                // If it's a URL, store it for opening
                if (field.value.startsWith("http")) {
                    setFileUrl(field.value);
                }
                const parts = field.value.split("/");
                setSelectedFile(parts[parts.length - 1]);
            }
        }
    }, [field.value]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const maxSizeInBytes = 1024 * 1024 * 5; // 5 MB
            const validType = file.type === "application/pdf";

            if (file.size > maxSizeInBytes) {
                return toast.warn(
                    "File size exceeds 5 MB. Please select a smaller file." +
                    formatCompactNumber(file.size / 1024)
                );
            }

            if (!validType) {
                return toast.warn("Invalid file type. Please select a PDF file.");
            }

            setIsDocument(true);
            setSelectedFile(file.name);
            // Create temporary URL for newly selected file
            const objectUrl = URL.createObjectURL(file);
            setFileUrl(objectUrl);

            const obj = fieldname ? { [fieldname]: file } : { documentUrl: file };
            setFormData((prev: any) => ({ ...prev, ...obj }));
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setIsDocument(false);
        setFileUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        const obj = fieldname ? { [fieldname]: null } : { documentUrl: null };
        setFormData((prev: any) => ({ ...prev, ...obj }));
    };

    const handleOpenFile = () => {
        if (fileUrl) {
            window.open(fileUrl, "_blank");
        } else {
            toast.warn("Unable to open file");
        }
    };

    return (
        <div className="flex flex-col justify-start space-y-2">
            <label
                htmlFor={field.name}
                className="block font-medium text-base text-gray-700"
            >
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
            />
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col justify-center items-center w-full bg-white h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition ${selectedFile ? "border-primary" : "border-gray-300"
                    }`}
            >
                {selectedFile ? (
                    <>
                        <MdPictureAsPdf size={60} className="text-red-500 mb-2" />
                        <span className="text-sm font-semibold text-gray-700 text-center px-2">
                            {selectedFile}
                        </span>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFile();
                                }}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-all duration-200 ease-linear flex items-center gap-1 text-xs"
                                title="Open PDF in new tab"
                            >
                                <MdOutlineOpenInNew size={14} /> Open
                            </button>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                            }}
                            className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 flex justify-center items-center aspect-square rounded-full p-1 hover:bg-primary transition-all duration-200 ease-linear"
                        >
                            ✕
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-600">
                        <h2 className="text-black-400 font-bold">Files We Accept</h2>
                        <p className="text-gray-600 text-xs py-2">
                            PDF (Max file size: 5MB)
                        </p>
                        <span>
                            <IoCloudUpload size={50} className="text-gray-500" />
                        </span>
                        <span className="text-gray-700">Click to upload</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUploader;
