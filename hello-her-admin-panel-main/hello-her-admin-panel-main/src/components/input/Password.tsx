import React, { FC, useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordProps {
  field: {
    name: string;
    label: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    confirmPlaceholder?: string;
  };
  setFormData?: any;
  className?: string;
  handleInputChange?: any;
}

const Password: FC<PasswordProps> = ({
  field,
  className,
  setFormData,
  handleInputChange,
}) => {
  const [password, setPassword] = useState(field.value || "");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    if (field.value !== undefined) {
      setPassword(field.value);
    }
  }, [field.value]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Update parent form data - check if setFormData exists
    if (setFormData && typeof setFormData === 'function') {
      setFormData((prev: any) => ({ ...prev, password: newPassword }));
    }
    
    // Call the handleInputChange if provided (for DynamicForm compatibility)
    if (handleInputChange && typeof handleInputChange === 'function') {
      handleInputChange(e);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Update parent form data - check if setFormData exists
    if (setFormData && typeof setFormData === 'function') {
      setFormData((prev: any) => ({ ...prev, confirmPassword: newConfirmPassword }));
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  return (
    <div className={`relative w-full ${className || ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-5">
        <div className="relative">
          <label
            htmlFor={field.name}
            className="block font-medium text-gray-700 mb-2"
          >
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            value={password}
            required={field.required}
            onChange={handlePasswordChange}
            type={showPassword ? "text" : "password"}
            placeholder={field.placeholder || "Enter your password"}
            className="border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span
            onClick={toggleShowPassword}
            className="absolute bottom-3 right-2 flex items-center cursor-pointer text-gray-600 hover:text-gray-800"
          >
            {!showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </span>
        </div>

        <div className="relative">
          <label htmlFor="confirmPassword" className="block font-medium text-gray-700 mb-2">
            Confirm Password
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <input
            id="confirmPassword"
            value={confirmPassword}
            required={field.required}
            name="confirmPassword"
            onChange={handleConfirmPasswordChange}
            type={showConfirmPassword ? "text" : "password"}
            placeholder={field.confirmPlaceholder || "Confirm your password"}
            className="border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span
            onClick={toggleShowConfirmPassword}
            className="absolute bottom-3 right-2 flex items-center cursor-pointer text-gray-600 hover:text-gray-800"
          >
            {!showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </span>
        </div>
      </div>
      {password && confirmPassword && password !== confirmPassword && (
        <p className="text-red-500 text-xs mt-2">⚠️ Passwords do not match</p>
      )}
    </div>
  );
};

export default Password;