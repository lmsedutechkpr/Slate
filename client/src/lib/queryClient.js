import { QueryClient } from "@tanstack/react-query"
import { buildApiUrl } from "./utils.js"

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText
    throw new Error(`${res.status}: ${text}`)
  }
}

export async function apiRequest(method, url, data) {
  // If url starts with /api, build the full URL
  const fullUrl = url.startsWith('/api') ? buildApiUrl(url) : url;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  })

  await throwIfResNotOk(res)
  return res
}

export const getQueryFn = ({ on401 }) => async ({ queryKey }) => {
  // Build the full API URL from queryKey
  const endpoint = queryKey.join("/");
  const fullUrl = endpoint.startsWith('/api') ? buildApiUrl(endpoint) : endpoint;
  
  const res = await fetch(fullUrl, {
    credentials: "include",
  })

  if (on401 === "returnNull" && res.status === 401) {
    return null
  }

  await throwIfResNotOk(res)
  return await res.json()
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})
