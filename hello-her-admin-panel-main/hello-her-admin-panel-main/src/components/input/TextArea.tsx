import React, { FC } from "react";

interface TextAreaProps {
  field: {
    name?: string;
    value?: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    defaultValue?: string;
    rows?: number; // Added rows prop for textarea
  };
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

const TextArea: FC<TextAreaProps> = ({
  field,
  handleInputChange,
  className,
}) => {
  return (
    <div className="relative">
      <label
        htmlFor={field.name}
        className="block font-medium text-gray-700 mb-2"
      >
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={field.name}
        name={field.name}
        value={field.value}
        required={field.required}
        disabled={field.isDisabled}
        placeholder={field.placeholder}
        onChange={handleInputChange}
        rows={field.rows ?? 4} // Default rows set to 4 if not specified
        className={`border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default TextArea;
