/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Auth.js JWT to every request (client-side only)
apiClient.interceptors.request.use(async (config) => {
  // Only try to get session on client side
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken || (session as any)?.user?.authId;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to append authentication token', error);
    }
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
