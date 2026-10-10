import React, { FC, useState } from "react";

interface EmailProps {
  field: {
    name: string;
    label: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    defaultValue?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Email: FC<EmailProps> = ({ field, handleInputChange, className }) => {
  const [email, setEmail] = useState(field.defaultValue || "");
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);

    if (!validateEmail(value) && value !== "") {
      setError("Please enter a valid email address.");
    } else {
      setError(null);
    }

    handleInputChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor={field.name}
        className="block font-medium text-gray-700 mb-2"
      >
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type="email"
        id={field.name}
        name={field.name}
        value={field?.value ? field?.value : email}
        placeholder={field.placeholder || "Enter your email"}
        required={field.required}
        disabled={field.isDisabled}
        onChange={handleChange}
        className={`border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Email;
