import React from "react";

interface ButtonProps {
  text: string;
  onClick?: any;
  classes?: string;
  isLoading?: boolean;
  type?: "button" | "submit";
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button",
  classes = "",
  isLoading = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`relative flex items-center justify-center text-nowrap px-4 py-2 border transition-all duration-200 ease-linears border-primary/20 text-primary hover:bg-primary hover:text-white rounded-md ${classes} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 mr-2 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      ) : null}
      {isLoading ? "Please wait..." : text}
    </button>
  );
};

export default Button;
