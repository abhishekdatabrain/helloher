"use client";

import Link from "next/link";
import Image from "next/image";
import { Post } from "@/hooks/apiUtils";
import { IoMdEye } from "react-icons/io";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { IoEye, IoEyeOff, IoLockClosedOutline } from "react-icons/io5";

const CreatePassword: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createPassword, setCreatePassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: any = await Post("/api/admin/reset-pass", {
        password: confirmPassword,
      });
      if (response.success) {
        router.push("/auth/login");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/auth/forgot-password");
    }
    setTimeout(() => {
      localStorage.removeItem("adminToken");
      router.push("/auth/forgot-password");
    }, 180000);
  }, [router]);

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
                Create Password
              </label>
              <div className="flex mt-4 justify-between shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <input
                  required
                  value={createPassword}
                  autoComplete="off"
                  placeholder="Enter your password"
                  className={`w-full text-primary px-4 py-2.5 placeholder:text-gray-400 text-xs bg-transparent outline-[#8b7eff] rounded-l-sm`}
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setCreatePassword(e.target.value)}
                />
                {showPassword ? (
                  <span className=" active:bg-[#8b7eff] bg-[#f3f2ff] py-1 rounded-r-md ">
                    <IoMdEye
                      onClick={() => setShowPassword(false)}
                      size={16}
                      className="text-[#8b7eff] active:text-[#f3f2ff] mx-3 my-1.5"
                    />
                  </span>
                ) : (
                  <span className=" bg-[#f3f2ff] active:bg-[#8b7eff] py-1 rounded-r-md">
                    <IoEyeOff
                      onClick={() => setShowPassword(true)}
                      size={16}
                      className="text-[#8b7eff] active:text-[#f3f2ff] mx-3 my-1.5"
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label
                className="block text-left font-semibold text-gray-700 text-xs required mb-2"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <div className="flex mt-4 justify-between shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <input
                  required
                  value={confirmPassword}
                  autoComplete="off"
                  placeholder="R-enter your password"
                  className={`w-full text-primary px-4 py-2.5 placeholder:text-gray-400 text-xs bg-transparent outline-[#8b7eff] rounded-l-sm`}
                  type={showConfirmPassword ? "text" : "password"}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (createPassword === e.target.value) {
                      setIsButtonDisabled(false);
                    } else {
                      setIsButtonDisabled(true);
                    }
                  }}
                />
                {showConfirmPassword ? (
                  <span className=" active:bg-[#8b7eff] bg-[#f3f2ff] py-1 rounded-r-md ">
                    <IoEye
                      onClick={() => setShowConfirmPassword(false)}
                      size={16}
                      className="text-[#8b7eff] active:text-[#f3f2ff] mx-3 my-1.5"
                    />
                  </span>
                ) : (
                  <span className=" bg-[#f3f2ff] active:bg-[#8b7eff] py-1 rounded-r-md">
                    <IoEyeOff
                      onClick={() => setShowConfirmPassword(true)}
                      size={16}
                      className="text-[#8b7eff] active:text-[#f3f2ff] mx-3 my-1.5"
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="flex mb-4 items-center">
              <input
                id="checked-checkbox"
                type="checkbox"
                value=""
                className="w-3.5 h-3.5 accent-[#8b7eff]"
              />
              <label
                htmlFor="checked-checkbox"
                className="ms-2 text-xs font-medium text-gray-400 dark:text-gray-300"
              >
                Remember password?
              </label>
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
            <IoLockClosedOutline
              size={16}
              className="text-[#ffffff] active:text-[#f3f2ff] mx-1 m-auto"
            />{" "}
            Save Password
          </button>
          <div className="flex-fill my-4 text-center">
            <p className="text-center text-xs text-gray-800/70 mb-5">
              Back to home ?{" "}
              <Link
                href={"/auth/forgot-password"}
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
            <h6 className="mb-0 font-semibold pb-1 text-base">
              Set Your New Password
            </h6>
            <p className="text-xs font-semibold text-gray-400 px-5">
              Create a secure password for protection.
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

export default CreatePassword;
