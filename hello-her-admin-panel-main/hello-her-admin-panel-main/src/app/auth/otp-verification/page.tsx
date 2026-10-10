import OtpVerification from "@/components/OtpVerification";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Otp_Verification: React.FC = () => {
  return (
    <div className="bg-[url('/assets/bg/bg.jpg')] bg-cover min-h-screen flex justify-center items-center">
      <div className="container-sm m-5 mx-2 bg-white shadow rounded-md h-auto items-center lg:py-2 lg:flex lg:w-2/3 lg:mx-auto">
        <div className="col mx-auto pt-6 px-10 max-w-md text-center lg:mx-0 lg:flex-auto lg:py-4 lg:text-left lg:w-2/4 lg:pt-8 lg:px-2 lg:pl-10">
          <OtpVerification email={undefined} />
        </div>
        <div className="col rounded m-4 py-4 mx-8 bg-[#fff8ec] lg:w-2/4">
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
            <h6 className="mb-0 fw-normal text-base">Verification in Progress</h6>
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

export default Otp_Verification;
