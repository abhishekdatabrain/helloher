"use client";

import Image from "next/image";
import { toast } from "react-toastify";
import { Post } from "@/hooks/apiUtils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { IoEye, IoEyeOff, IoLogInOutline } from "react-icons/io5";

const Login: React.FC = () => {
  const router = useRouter();
  const { token, login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
    router.prefetch("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response: any = await Post("/api/admin/login", { email, password });
      if (response?.success && response?.token && response?.user)
        login(response.token, response.user);
    } catch (error: any) {
      console.log("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasMounted || token) return null;

  return (
    <div className="bg-[url('/assets/bg/bg.jpg')] bg-cover bg-center min-h-screen flex justify-center items-center">
      <div className="w-full bg-white backdrop-blur-2xl bg-opacity-30 p-6 mx-4 rounded-2xl md:max-w-sm md:mx-auto">
        <Image
          src="/assets/logo/logo.png"
          alt="Icon"
          width={200}
          height={100}
          className="w-40 mb-5 mx-auto object-contain"
        />
        <h2 className="text-xl md:text-2xl font-bold text-center text-primary mb-2">
          Login to your account
        </h2>
        <p className="text-center text-xs w-3/4 mx-auto text-white/80 lg:text-primary mb-8">
          Enter your email and password below to access your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-primary mb-1"
            >
              Email Address
            </label>
            <input
              required
              id="email"
              type="email"
              autoComplete="off"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 text-primary placeholder-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-primary mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                required
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-10 text-primary placeholder-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4 cursor-pointer text-primary hover:text-primary"
              >
                {showPassword ? <IoEye size={22} /> : <IoEyeOff size={22} />}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 flex text-base justify-center items-center gap-2 text-white bg-primary hover:bg-primary-dark rounded-lg transition duration-200 ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <IoLogInOutline size={24} />
            {isSubmitting ? "Signing In..." : "Sign In to Your Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
