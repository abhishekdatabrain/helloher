"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";

interface StatutoryBenefitsFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

interface Section {
  heading: string;
  type: "text" | "bullets" | "list" | "buttons";
  content: string | string[] | { label: string; action: string }[];
}

const StatutoryBenefitsForm: React.FC<StatutoryBenefitsFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [formData, setFormData] = useState<any>({
    title: data.title ?? "",
    key: data.key ?? "",
    access: data.access ?? "paid",
    sections: data.sections ?? [],
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSection, setNewSection] = useState<any>({
    heading: "",
    type: "text",
    content: "",
  });

  const handleSectionChange = (field: keyof Section, value: any) => {
    setNewSection({ ...newSection, [field]: value });
  };

  const handleContentChange = (value: any, index?: number, subfield?: keyof { label: string; action: string }) => {
    if (newSection.type === "bullets" || newSection.type === "list") {
      const updated = [...((newSection.content as string[]) || [])];
      updated[index!] = value;
      setNewSection({ ...newSection, content: updated });
    } else if (newSection.type === "buttons") {
      const updated = [...((newSection.content as { label: string; action: string }[]) || [])];
      updated[index!] = {
        ...updated[index!],
        [subfield!]: value,
      };
      setNewSection({ ...newSection, content: updated });
    }
  };

  const removeFromContentArray = (index: number) => {
    const content = [...(newSection.content as any[])];
    content.splice(index, 1);
    setNewSection({ ...newSection, content });
  };

  const addToContentArray = () => {
    if (newSection.type === "bullets" || newSection.type === "list") {
      const content = [...((newSection.content as string[]) || []), ""];
      setNewSection({ ...newSection, content });
    } else if (newSection.type === "buttons") {
      const content = [...((newSection.content as { label: string; action: string }[]) || []), { label: "", action: "" }];
      setNewSection({ ...newSection, content });
    }
  };

  const addOrUpdateSection = () => {
    const updated = [...formData.sections];
    if (editingIndex !== null) updated[editingIndex] = newSection;
    else updated.push(newSection);
    setFormData({ ...formData, sections: updated });
    setNewSection({ heading: "", type: "text", content: "" });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setNewSection(formData.sections[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updated = formData.sections.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, sections: updated });
    setEditingIndex(null);
    setNewSection({ heading: "", type: "text", content: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.key || formData.sections.length === 0) {
      return toast.warn("Please fill required fields and add at least one section");
    }
    try {
      const url = data?._id ? `${endpoints[formType].url}/${data._id}` : endpoints[formType].url;
      const response: any = data?._id ? await Put(url, formData) : await Post(url, formData);

      if (response?.success) {
        const resp: any = await Fetch(endpoints[formType].url);
        if (resp?.success) props?.setFilteredData?.(resp.data.result);
        if (resp?.data?.pagination) props?.setPaginate?.(resp.data.pagination);
        props?.onClose?.();
      } else toast.error("Something went wrong");
    } catch (err: any) {
      toast.error("Submission failed: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Statutory Benefits Details" : "Add New Statutory Benefits"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold">Title</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 text-black placeholder:text-gray-400 focus:ring-blue-500 focus:border-transparent`}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Key (slug)</label>
            <input
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className={`border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 text-black placeholder:text-gray-400 focus:ring-blue-500 focus:border-transparent`}
              required
              disabled={data?.key}
            />
          </div>
        </div>
        <div className="space-y-4 border border-gray-200 shadow-lg p-4 rounded-2xl text-sm text-gray-700">
          <h2 className="text-lg font-bold -mb-2">Add Section</h2>
          <div className="flex gap-5 items-center">
            {/* Section Heading */}
            <div className="space-y-1 w-1/2">
              <label className="font-semibold text-gray-800" htmlFor="section-heading">Section Heading</label>
              <input
                id="section-heading"
                value={newSection.heading}
                onChange={(e) => handleSectionChange("heading", e.target.value)}
                placeholder="e.g., Key Features, Instructions, Call to Action"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">Provide a short and descriptive title for this section.</p>
            </div>

            {/* Section Type */}
            <div className="space-y-1 w-1/2">
              <label className="font-semibold text-gray-800" htmlFor="section-type">Section Type</label>
              <select
                id="section-type"
                value={newSection.type}
                onChange={(e) => handleSectionChange("type", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text">Text</option>
                <option value="bullets">Bullets</option>
                <option value="list">List</option>
                <option value="buttons">Buttons</option>
              </select>
              <p className="text-xs text-gray-500">Choose the type of content you want to include in this section.</p>
            </div>
          </div>

          {/* Text Content */}
          {newSection.type === "text" && (
            <div className="space-y-1">
              <label className="font-semibold text-gray-800">Content</label>
              <textarea
                value={newSection.content as string}
                onChange={(e) => handleSectionChange("content", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the paragraph content for this section..."
                rows={4}
              />
              <p className="text-xs text-gray-500">You can write a paragraph, description or details related to the heading above.</p>
            </div>
          )}

          {/* Bullets or List Content */}
          {(newSection.type === "bullets" || newSection.type === "list") && (
            <div className="space-y-2">
              <label className="font-semibold text-gray-800">Items</label>
              {Array.isArray(newSection?.content) && (newSection.content as string[]).map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={item}
                    onChange={(e) => handleContentChange(e.target.value, index)}
                    className="flex-1 p-2 border border-gray-300 rounded"
                    placeholder={`Item ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFromContentArray(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove Item"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addToContentArray}
                className="bg-blue-600 px-2 py-1 text-white rounded ml-2 text-xs"
              >
                + Add Item
              </button>
              <p className="text-xs text-gray-500">Add individual bullet or list points for this section.</p>
            </div>
          )}

          {/* Buttons Content */}
          {newSection.type === "buttons" && (
            <div className="space-y-2">
              <label className="font-semibold text-gray-800">Buttons</label>
              {Array.isArray(newSection?.content) && (newSection.content as { label: string; action: string }[]).map((item, index) => (
                <div key={index} className="p-2 rounded-lg border border-gray-200 gap-3 bg-gray-50 flex">
                  <input
                    placeholder="Button Label (e.g., Learn More)"
                    value={item.label}
                    onChange={(e) => handleContentChange(e.target.value, index, "label")}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    placeholder="Button Action (e.g., /learn-more or https://...)"
                    value={item.action}
                    onChange={(e) => handleContentChange(e.target.value, index, "action")}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromContentArray(index)}
                    className="bg-red-600 px-2 whitespace-nowrap py-1 text-white rounded-lg text-xs"
                  >
                    Remove Button
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addToContentArray}
                className="bg-blue-600 px-2 py-1 text-white rounded ml-2 text-xs"
              >
                + Add Button
              </button>
              <p className="text-xs text-gray-500">Add interactive buttons with labels and actions/URLs.</p>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={addOrUpdateSection}
            className="w-full sm:w-fit px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {editingIndex !== null ? "Update Section" : "Add Section"}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {formData.sections.map((section: any, index: number) => (
            <div key={index} className="border px-4 py-2 rounded-lg shadow">
              <div className="flex justify-between">
                <strong>{section.heading}</strong>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(index)} className="text-white px-2 py-0.5 text-xs rounded bg-blue-500">Edit</button>
                  <button type="button" onClick={() => handleDelete(index)} className="text-white px-2 py-0.5 text-xs rounded bg-red-500">Delete</button>
                </div>
              </div>
              <div className="text-sm text-gray-600">Type: {section.type}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Submit</button>
          <button type="button"
            onClick={() => props?.onClose?.()}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StatutoryBenefitsForm;
