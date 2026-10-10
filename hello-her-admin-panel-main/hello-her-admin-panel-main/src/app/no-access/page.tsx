"use client";

import Link from "next/link";
import { FaLock } from "react-icons/fa";
import AuthGuard from "@/components/AuthGuard";
import Wrapper from "@/components/common/Wrapper";

export default function page() {
  return (
    <AuthGuard>
      <Wrapper>
        <div className="flex flex-col items-center justify-center h-screen bg-white rounded-2xl">
          <div className="max-w-2xl text-center">
            <div className="flex items-center justify-center mb-6">
              <FaLock className="text-red-500 text-7xl" />
            </div>
            <h1 className="text-3xl md:text-6xl font-bold text-gray-800 mb-4">
              Access Denied
            </h1>
            <p className="text-base md:text-base text-gray-600 mb-8">
              You don&apos;t have the required permissions. If you believe this
              is a mistake, please contact your administrator.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={"mailto:contact@gmail.com"}
                className="px-6 py-3 bg-red-500 text-white rounded-lg text-base hover:bg-red-600 transition"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </Wrapper>
    </AuthGuard>
  );
}
