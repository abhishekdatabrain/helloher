import { Fetch, Put } from "./apiUtils";

export const functionList: Record<string, (data: any) => Promise<boolean>> = {
  Agent: async (data: any) => {
    if (!data?._id) return false;
    try {
      const url = `/api/support/deactivate-agent/${data._id}`;
      const response: any = await Fetch(url);
      return response?.success ?? false;
    } catch (error) {
      console.log("Error updating agent status:", error);
      return false;
    }
  },
  Guest: async (data: any) => {
    if (!data?._id) return false;
    try {
      const url = `/api/user/guest/${data._id}`;
      const response: any = await Put(url, { status: data?.status });
      return response?.success ?? false;
    } catch (error) {
      console.log("Error updating guest status:", error);
      return false;
    }
  },
  "Property Owner": async (data: any) => {
    if (!data?._id) return false;
    try {
      const url = `/api/user/property/${data._id}`;
      const response: any = await Put(url, { status: data?.status });
      return response?.success ?? false;
    } catch (error) {
      console.log("Error updating property owner status:", error);
      return false;
    }
  },
  Users: async (data: any) => {
    if (!data?._id) return false;
    try {
      const url = `/api/user/all/${data._id}`;
      const response: any = await Put(url, { isBlocked: data.status });
      return response?.success ?? false;
    } catch (error) {
      console.log("Error blocking/unblocking user:", error);
      return false;
    }
  },
  ServiceProviders : async (data: any) => {
    if (!data?._id) return false;
    try {
      const url = `/api/provider/${data._id}`;
      const response: any = await Put(url, { isBlocked: data.status });
      return response?.success ?? false;
    } catch (error) {
      console.log("Error blocking/unblocking user:", error);
      return false;
    }
  },
};
