"use client";

import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastProvider = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;
    return (
        <ToastContainer
            rtl={false}
            autoClose={2000}
            newestOnTop={true}
            position="top-right"
            hideProgressBar={false}
        />
    );
};

export default ToastProvider;
