"use client";

import { toast } from "react-toastify";
import { IoCloudUpload } from "react-icons/io5";
import React, { FC, useState, useRef } from "react";

interface SingleAudioUploaderProps {
    field: {
        name: string;
        label: string;
        required?: boolean;
        value?: string | null;
    };
    setFormData: (newState: any) => void;
}

const SingleAudioUploader: FC<SingleAudioUploaderProps> = ({ field, setFormData }) => {
    const fieldname = field?.name;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<string | null>(field.value ?? null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const maxSizeInBytes = 1024 * 1024 * 5; // 5 MB
            const validTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3", "audio/ogg"];

            if (file.size > maxSizeInBytes) {
                return toast.warn("File size exceeds 5 MB. Please select a smaller file.");
            }

            if (!validTypes.includes(file.type) && !file.type.startsWith("audio/")) {
                return toast.warn("Invalid file type. Please select an audio file (MP3, WAV, OGG).");
            }

            const audioUrl = URL.createObjectURL(file);
            setSelectedAudio(audioUrl);
            setFileName(file.name);

            const obj = fieldname ? { [fieldname]: file } : { audioUrl: file };
            setFormData((prev: any) => ({ ...prev, ...obj }));
        }
    };

    const handleRemoveAudio = () => {
        setSelectedAudio(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        const obj = fieldname ? { [fieldname]: null } : { audioUrl: null };
        setFormData((prev: any) => ({ ...prev, ...obj }));
    };

    return (
        <div className="flex flex-col justify-start space-y-4">
            <label htmlFor={field.name} className="block font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                ref={fileInputRef}
                className="hidden"
            />

            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col justify-start w-full h-24 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors duration-300"
            >
                {selectedAudio ? (
                    <>
                        <div className="flex items-center justify-between px-4 w-full h-full">
                            <audio controls src={selectedAudio} className="w-full" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAudio();
                                }}
                                className="ml-2 bg-primary text-white w-8 h-8 flex justify-center items-center rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-500">
                        <IoCloudUpload size={40} className="text-primary" />
                        <span className="text-sm text-primary">Click to upload an audio sample</span>
                        <span className="text-xs text-gray-500">MP3, WAV, OGG (Max 5MB)</span>
                    </div>
                )}
            </div>
            {fileName && <div className="text-xs text-gray-500">{fileName}</div>}
        </div>
    );
};

export default SingleAudioUploader;
