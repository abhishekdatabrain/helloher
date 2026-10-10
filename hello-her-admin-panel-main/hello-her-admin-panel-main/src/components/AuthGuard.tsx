"use client";

import Loader from "./common/Loader";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Wait until hydration before accessing localStorage
    const localToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    // Client-side redirection logic only after mount
    if (!localToken && !token) {
      setIsAuthenticated(false);
      router.replace("/auth/login");
    } else {
      setIsAuthenticated(true);
      if (pathname === "/") {
        router.replace("/dashboard");
      }
    }
  }, [token, router, pathname]);

  // Avoid rendering anything until the component is hydrated
  if (!isMounted || isAuthenticated === null) {
    return <Loader />;
  }

  return <>{isAuthenticated ? children : <Loader />}</>;
};

export default AuthGuard;
