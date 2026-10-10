"use client";

import { MdInfoOutline } from "react-icons/md";
import { FiAlertCircle } from "react-icons/fi";
import { FaRegClipboard } from "react-icons/fa";

export default function NoFormFallback() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-8 animate-fade-in">
            <div className="text-6xl text-indigo-500 mb-6">
                <FaRegClipboard className="animate-bounce-slow" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight mb-2">
                No Form Found
            </h2>

            <p className="text-center text-sm text-gray-500 max-w-md leading-relaxed mb-4">
                <MdInfoOutline className="inline-block mr-1 text-indigo-400 text-base align-text-top" />
                Looks like the form you&apos;re trying to access is not configured or currently unavailable.
            </p>

            <div className="flex items-center text-sm text-gray-500 gap-1">
                <FiAlertCircle className="text-yellow-500" />
                <span>Reach out to your admin or try refreshing the page.</span>
            </div>
        </div>
    );
}