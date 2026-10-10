"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const AuthPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    if (token === null) return navigate.push("/auth/login"); // if admin is not logged In
  }, [navigate, token]);

  return null;
};

export default AuthPage;
