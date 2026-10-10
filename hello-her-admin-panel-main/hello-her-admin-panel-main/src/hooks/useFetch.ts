"use client";
import { useState, useEffect } from "react";
import { buildApiUrl, normalizeBaseUrl } from "@/utils/apiUrl";

interface FetchState {
  data: any;
  loading: boolean;
  error: string | null;
}

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

const cache: { [key: string]: any } = {};
const BASEURL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);

function useFetch(url: string, options?: FetchOptions) {
  const [state, setState] = useState<FetchState>({
    data: cache[url] || null, // Load data from cache if available
    loading: !cache[url], // Skip loading if data is cached
    error: null,
  });

  useEffect(() => {
    if (cache[url]) return; // If data is cached, do not fetch again
    let isMounted = true;

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 10000); // Abort request after 10 seconds

    const fetchData = async () => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetch(buildApiUrl(BASEURL, url), {
          ...options,
          signal: controller.signal, // Attach AbortController signal
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("adminToken"),
            ...(options?.headers || {}),
          },
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(
            errorDetails.message ||
              `Error ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (isMounted) {
          cache[url] = data; // Cache the response
          setState({ data, loading: false, error: null });
        }
      } catch (error: any) {
        if (isMounted) {
          if (didTimeout || error.name === "AbortError" || error.name === "CanceledError") {
            setState({
              data: null,
              loading: false,
              error: "Request timed out after 10 seconds",
            });
          } else {
            setState({
              data: null,
              loading: false,
              error: error.message || "An unknown error occurred",
            });
          }
        }
      } finally {
        clearTimeout(timeoutId); // Clear timeout after request completes
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Prevent state updates after component unmount
      controller.abort(); // Abort fetch on unmount
    };
  }, [url, options]);

  return state;
}

export default useFetch;

// HOW TO USE IT

// const { data, loading, error } = useFetch<DataType[]>(
//   "https://example.com/api/data",
//   {
//     method: "POST",
//     headers: {
//       Authorization: "Bearer token",
//     },
//     body: JSON.stringify({ key: "value" }),
//   }
// );
