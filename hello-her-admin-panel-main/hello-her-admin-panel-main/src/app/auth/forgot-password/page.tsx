"use client";

import { IoSend } from "react-icons/io5";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Post } from "@/hooks/apiUtils";
import { useRouter } from "next/navigation";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [isButtonDisabled] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: any = await Post("/api/admin/forgot-pass", {
        email: email,
      });
      if (response.success) {
        localStorage.setItem("email", email);
        router.push("/auth/otp-verification");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-[url('/assets/bg/bg.jpg')] bg-cover min-h-screen flex justify-center items-center">
      <div className="container-sm m-5 mx-2 bg-white shadow rounded-md h-auto items-center lg:py-2 lg:flex lg:w-2/3 lg:mx-auto">
        <div className="col mx-auto pt-6 items-center max-w-md text-center lg:mx-0 lg:flex-auto lg:py-4 lg:text-left lg:w-2/4 lg:pt-8 lg:px-2 lg:pl-10">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-left font-semibold text-gray-700 text-xs required mb-2"
                htmlFor="createPassword"
              >
                Email Address
              </label>
              <div className="flex mt-4 justify-between shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <input
                  required
                  value={email}
                  autoComplete="off"
                  placeholder="Enter your email"
                  className={`w-full text-primary px-4 py-2.5 placeholder:text-gray-400 text-xs bg-transparent outline-[#8b7eff] rounded`}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </form>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`w-full py-1 flex justify-center text-white rounded-md transition text-m duration-200 ${isButtonDisabled
              ? "bg-primary cursor-not-allowed"
              : "bg-primary hover:bg-primary-700"
              }`}
          >
            <IoSend
              size={16}
              className="text-[#ffffff] active:text-[#f3f2ff] mx-1 m-auto"
            />{" "}
            Send Otp
          </button>
          <div className="flex-fill my-4 text-center">
            <p className="text-center text-xs text-gray-800/70 mb-5">
              Back to home ?{" "}
              <Link
                href={"/auth/login"}
                className="text-blue-600 underline-offset-1"
              >
                Click Here
              </Link>
            </p>
          </div>
        </div>
        <div className="col rounded m-4 py-4 items-center bg-[#fff8ec] lg:w-2/4">
          <Image
            src={"/assets/otp/otp.png"}
            alt="Illustration"
            width={220}
            height={180}
            priority
            unoptimized
            className="mx-auto mt-4 object-contain"
          ></Image>
          <div className="flex-fill my-4 text-center">
            <h6 className="mb-0 font-semibold pb-1 text-base">Forgot Password</h6>
            <p className="text-xs font-semibold text-gray-400 px-5">
              Send otp on your register email.
            </p>
          </div>
          <Link href="">
            <Image
              src={"/assets/logo/logo.png"}
              alt="logo"
              width={85}
              height={75}
              priority
              unoptimized
              className="mx-auto my-4 bg-blue-200 object-contain"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
