import { useState, useRef } from "react";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const DynamicStringInput = ({
  field,
  keyname,
  formData,
  setFormData,
}: {
  field: any;
  keyname: any;
  formData: any;
  setFormData: any;
}) => {
  const [newInput, setNewInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputs, setInputs] = useState<string[]>(
    formData && formData[keyname] ? formData[keyname] : []
  );
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  const handleAddOrUpdate = () => {
    if (newInput.trim() === "") {
      showError("Input cannot be empty!");
      return;
    }

    if (inputs.includes(newInput.trim()) && editIndex === null) {
      showError("This item already exists!");
      return;
    }

    if (editIndex !== null) {
      const updatedInputs = [...inputs];
      updatedInputs[editIndex] = newInput.trim();
      setInputs(updatedInputs);
      setEditIndex(null);
      setFormData((prev: any) => ({ ...prev, [keyname]: updatedInputs }));
    } else {
      const newInputs = [...inputs, newInput.trim()];
      setInputs(newInputs);
      setFormData((prev: any) => ({
        ...prev,
        [keyname]: newInputs,
      }));
    }

    setNewInput("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEdit = (index: number) => {
    setNewInput(inputs[index]);
    setEditIndex(index);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setNewInput("");
    setError("");
  };

  const handleDelete = (index: number) => {
    setAnimatingItems((prev) => new Set([...prev, index]));

    setTimeout(() => {
      const updatedInputs = inputs.filter((_, i) => i !== index);
      setInputs(updatedInputs);
      setFormData((prev: any) => ({ ...prev, [keyname]: updatedInputs }));
      setAnimatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 200);
  };

  const handleClearAll = () => {
    setInputs([]);
    setFormData((prev: any) => ({ ...prev, [keyname]: [] }));
    setEditIndex(null);
    setNewInput("");
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOrUpdate();
    } else if (e.key === "Escape" && editIndex !== null) {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {field?.label}
            <span className="text-sm font-normal text-gray-500">
              ({inputs.length} {inputs.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <p className="text-sm text-gray-600">
            Add and manage your list items
          </p>
        </div>
        {inputs.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="group px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300"
          >
            <FiTrash2
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            Clear All
          </button>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newInput}
              placeholder={
                editIndex !== null ? "Update item..." : "Enter new item..."
              }
              onChange={(e) => setNewInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className={`w-full px-4 py-3 text-sm border-2 rounded-xl transition-all duration-200 outline-none ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:bg-white"
                  : editIndex !== null
                  ? "border-yellow-300 bg-yellow-50 focus:border-yellow-500 focus:bg-white"
                  : "border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400"
              } focus:shadow-lg focus:shadow-blue-100`}
            />
            {error && (
              <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-600 animate-pulse">
                <FiAlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {editIndex !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 flex items-center gap-2 border border-gray-300 hover:border-gray-400"
              >
                <FiX size={16} />
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleAddOrUpdate}
              disabled={!newInput.trim()}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                editIndex !== null
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white border-2 border-yellow-500 hover:border-yellow-600"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 hover:border-blue-700"
              } ${newInput.trim() ? "hover:scale-105 active:scale-95" : ""}`}
            >
              {editIndex !== null ? (
                <>
                  <FiCheck size={16} />
                  Update
                </>
              ) : (
                <>
                  <FiPlus size={16} />
                  Add Item
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      {inputs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              Your Items
            </span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {inputs.map((input, index) => (
              <div
                key={`${input}-${index}`}
                className={`group flex justify-between items-center p-2 rounded-xl border-2 transition-all duration-200 ${
                  editIndex === index
                    ? "border-yellow-300 bg-yellow-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                } ${
                  animatingItems.has(index)
                    ? "transform scale-95 opacity-0"
                    : "transform scale-100 opacity-100"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      editIndex === index
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {input}
                  </span>
                  {editIndex === index && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
                      Editing
                    </span>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    disabled={editIndex !== null}
                    className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                    title="Edit item"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    disabled={editIndex !== null}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                    title="Delete item"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {inputs.length === 0 && (
        <div className="text-center p-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FiPlus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No items yet
          </h3>
          <p className="text-sm text-gray-500">
            Add your first item using the input field above
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicStringInput;
