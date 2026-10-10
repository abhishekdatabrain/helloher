"use client";

import { toast } from "react-toastify";
import { FormEvent, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { tabs, flattenTabs } from "@/data/tabs";
import { Fetch, Post, Put } from "@/hooks/apiUtils";

interface ManageRoleFormProps {
  data?: any;
  formType: string;
  onClose?: () => void;
  setPaginate?: (data: any) => void;
  setFilteredData?: (data: any) => void;
}

const ManageRoleForm: React.FC<ManageRoleFormProps> = ({
  data,
  onClose,
  formType,
  setPaginate,
  setFilteredData,
}) => {
  const allRoutes = flattenTabs(tabs);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(data?.name || "");
  const [description, setDescription] = useState(data?.description || "");
  const [permissions, setPermissions] = useState(
    data?.permissions
      ? allRoutes.map((tab) => {
        const existingPermission = data.permissions.find(
          (perm: any) => perm.module === tab.permission
        );
        return {
          module: tab.permission,
          access: {
            read: existingPermission?.access.read || false,
            update: existingPermission?.access.update || false,
            create: existingPermission?.access.create || false,
            delete: existingPermission?.access.delete || false,
          },
        };
      })
      : allRoutes.map((tab) => ({
        module: tab.permission,
        access: {
          read: false,
          create: false,
          update: false,
          delete: false,
        },
      }))
  );

  const handleCheckboxChange = (
    moduleName: string,
    accessType: keyof (typeof permissions)[0]["access"]
  ) => {
    setPermissions((prevPermissions) =>
      prevPermissions.map((perm) =>
        perm.module === moduleName
          ? {
            ...perm,
            access: {
              ...perm.access,
              [accessType]: !perm.access[accessType],
            },
          }
          : perm
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = endpoints[formType]?.url;

      setLoading(true);

      const payload = {
        description,
        permissions,
        name: name.toLowerCase(),
      };

      const resp: any = data?._id
        ? await Put(`${url}/${data?._id}`, payload, 5000, true)
        : await Post(url, payload, 5000, true);

      if (resp.success) {
        const response: any = await Fetch(url, {}, 5000, true, false);
        if (response?.success) {
          setFilteredData?.(response?.data?.result);
          setPaginate?.(response?.data?.pagination);
        } else window.location.reload();
        onClose?.();
      } else toast.error("Failed to update permissions");
    } catch (error) {
      console.log("Failed to update permissions", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 w-full">
        <label className="block font-semibold text-gray-800">Role Name</label>
        <textarea
          rows={1}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 p-2 border text-black rounded-lg w-full outline-none"
          placeholder="e.g., Administrator, Project Manager"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold text-gray-800">Role Description</label>
        <textarea
          rows={3}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 p-2 border text-black rounded-lg w-full outline-none"
          placeholder="Describe the responsibilities and access level for this role"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-primary whitespace-nowrap text-sm font-medium text-white">
              <th className="px-4 py-2 text-left flex items-center gap-2">
                Access Control
                <span className="text-xs font-light text-white/80">
                  (Toggle all permissions)
                </span>
              </th>
              <th className="px-4 py-2 text-center">Create</th>
              <th className="px-4 py-2 text-center">View</th>
              <th className="px-4 py-2 text-center">Edit</th>
              <th className="px-4 py-2 text-center">Remove</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm, index) => {
              const allSelected = Object.values(perm.access).every(Boolean);
              return (
                <tr key={index} className="border-b">
                  <td className="pr-4 py-2 font-semibold text-black flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        setPermissions((prevPermissions) =>
                          prevPermissions.map((p) =>
                            p.module === perm.module
                              ? {
                                ...p,
                                access: {
                                  create: !allSelected,
                                  read: !allSelected,
                                  update: !allSelected,
                                  delete: !allSelected,
                                },
                              }
                              : p
                          )
                        );
                      }}
                      className="form-checkbox cursor-pointer ml-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      title={allSelected ? "Unselect All" : "Select All"}
                    />
                    <span className="text-sm">{perm.module}</span>
                  </td>
                  {Object.keys(perm.access).map((accessType) => (
                    <td key={accessType} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={
                          perm.access[accessType as keyof typeof perm.access]
                        }
                        onChange={() =>
                          handleCheckboxChange(
                            perm.module,
                            accessType as keyof typeof perm.access
                          )
                        }
                        className="form-checkbox cursor-pointer flex items-center justify-center mx-auto w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-primary"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-3 space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="py-1.5 px-4 bg-blue-500 text-white rounded-lg text-lg"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="py-1.5 px-4 bg-red-600 text-white rounded-lg text-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ManageRoleForm;
