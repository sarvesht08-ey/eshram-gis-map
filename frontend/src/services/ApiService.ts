import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL

class ApiClient {
  async executeQuery(payload: any) {
    const response = await fetch(`${API_BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Query API error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async getQueryHistory() {
    return fetch(`${API_BASE_URL}/api/query-history`).then((r) => r.json());
  }
}

const apiClient = new ApiClient();

export const useApiClient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeWithLoading = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    client: apiClient,
    loading,
    error,
    executeWithLoading,
  };
};

export const useWebSocketConnection = () => {
  const connect = () => {
    console.warn("useWebSocketConnection is not implemented");
  };
  return { connect };
};
