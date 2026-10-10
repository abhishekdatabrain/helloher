"use client";
import { useEffect, useState } from "react";

const HydrationGuard = ({ children }: { children: React.ReactNode }) => {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    if (!hasMounted) return null;
    return <>{children}</>;
};

export default HydrationGuard;
