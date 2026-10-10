"use client";

import React, {
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useContext,
  createContext,
} from "react";
import { Fetch } from "@/hooks/apiUtils";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { flattenTabs, tabs } from "@/data/tabs";
import useIsDarkMode from "@/hooks/useIsDarkMode";

interface User {
  _id: string;
  name: string;
  username: string;
  role: {
    name: string;
    permissions: any[];
  };
  email: string;
}

interface AuthContextProps {
  user: User | null;
  logout: () => void;
  isDarkMode: boolean;
  token: string | null;
  login: (token: string, userData: User) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { isDarkMode } = useIsDarkMode();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    router.prefetch("/dashboard");

    const sharedToken = localStorage.getItem("adminToken");

    const fetchUser = async () => {
      try {
        const response: any = await Fetch("api/admin/current/user", {}, 5000, true, false);
        if (response?.success && response?.user) {
          setUser(response.user);
          setToken(sharedToken);
          handleRedirect(response.user.role?.permissions);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.log("❌ Auth fetch error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    if (sharedToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted, router]);

  const handleRedirect = (permissions: any[]) => {
    const flat = flattenTabs(tabs);
    const readable = permissions?.filter((p) => p?.access?.read);
    const firstModule = readable?.[0]?.module;

    const firstLink = flat.find((tab) => tab.permission === firstModule)?.href;
    const storedPath = localStorage.getItem("pathname");

    if (firstLink) {
      router.replace(storedPath || firstLink);
    } else {
      router.replace("/no-access");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    router.replace("/auth/login");
  };

  const login = (authToken: string, userData: User) => {
    localStorage.setItem("adminToken", authToken);
    setToken(authToken);
    setUser(userData);
    handleRedirect(userData?.role?.permissions);
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout: handleLogout,
      isDarkMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isDarkMode]
  );

  if (!hasMounted || loading) return <Loader />;

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
