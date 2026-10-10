"use client";

import { IoMdEye } from "react-icons/io";
import { IoEye, IoEyeOff, IoLockClosedOutline } from "react-icons/io5";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Post } from "@/hooks/apiUtils";

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPasswrod, setShowNewPasswrod] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isButtonDisabled] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: any = await Post("vendors/reset-password", {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });
      if (response.success) {
        localStorage.setItem("accessToken", response?.data?.accessToken);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-[url('/assets/bg/bg.jpg')] bg-cover min-h-screen flex justify-center items-center">
      <div className="container-sm m-5 mx-2 bg-white shadow rounded-md h-auto items-center lg:py-2 lg:flex lg:w-3/5 lg:mx-auto">
        <div className="col mx-auto pt-6 items-center max-w-md text-center lg:mx-0 lg:flex-auto lg:py-4 lg:text-left lg:w-2/4 lg:pt-8 lg:px-2 lg:pl-10">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-left font-semibold text-gray-700 text-xs required mb-2"
                htmlFor="currentPassword"
              >
                Current Password
              </label>
              <div className="flex mt-4 justify-between shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <input
                  required
                  value={currentPassword}
                  autoComplete="off"
                  placeholder="Enter your current password"
                  className={`w-full text-primary px-4 py-2.5 placeholder:text-gray-400 text-xs bg-transparent outline-[#8b7eff] rounded-l-sm`}
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                htmlFor="newPassword"
              >
                New Password
              </label>
              <div className="flex mt-4 justify-between shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <input
                  required
                  value={newPassword}
                  autoComplete="off"
                  placeholder="Enter a new password"
                  className={`w-full text-primary px-4 py-2.5 placeholder:text-gray-400 text-xs bg-transparent outline-[#8b7eff] rounded-l-sm`}
                  type={showNewPasswrod ? "text" : "password"}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {showNewPasswrod ? (
                  <span className=" active:bg-[#8b7eff] bg-[#f3f2ff] py-1 rounded-r-md ">
                    <IoEye
                      onClick={() => setShowNewPasswrod(false)}
                      size={16}
                      className="text-[#8b7eff] active:text-[#f3f2ff] mx-3 my-1.5"
                    />
                  </span>
                ) : (
                  <span className=" bg-[#f3f2ff] active:bg-[#8b7eff] py-1 rounded-r-md">
                    <IoEyeOff
                      onClick={() => setShowNewPasswrod(true)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
          </form>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`w-full py-2 mt-4 flex justify-center text-white rounded-md transition text-m duration-200 ${isButtonDisabled
              ? "bg-primary cursor-not-allowed"
              : "bg-primary hover:bg-primary-700"
              }`}
          >
            <IoLockClosedOutline
              onClick={() => setShowConfirmPassword(true)}
              size={16}
              className="text-[#ffffff] active:text-[#f3f2ff] mx-1 m-auto"
            />{" "}
            Reset Password
          </button>
          <div className="flex-fill my-4 text-center">
            <p className="text-center text-xs font-semibold text-gray-800/70 mb-5">
              Want to go back?{" "}
              <Link href={""} className="text-blue-600 underline-offset-1">
                Click Here
              </Link>
            </p>
          </div>
        </div>
        <div className="col rounded m-4 mx-8 py-4 min-h-96 bg-[#fff8ec] lg:w-2/4">
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
              Verification in Progress
            </h6>
            <p className="text-xs font-semibold text-gray-400 px-4">
              Please enter the code sent to your Email or phone.
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

export default ResetPassword;
