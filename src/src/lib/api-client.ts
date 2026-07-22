/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Auth.js JWT or custom token to every request (client-side only)
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token: string | null = null;

    // Check for admin token (credential-based login)
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      token = adminToken;
    }

    // Check for doctor token (authId-based login)
    const doctorToken = localStorage.getItem('doctor_token');
    if (doctorToken) {
      token = doctorToken;
    }

    // Fall back to NextAuth session token
    if (!token) {
      try {
        const session = await getSession();
        token = (session as any)?.accessToken || null;
      } catch {
        // ignore
      }
    }

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Only redirect to signin for actual auth failures, not on every 401
        const path = window.location.pathname;
        if (path.startsWith('/admin')) {
          window.location.href = '/admin';
        } else if (path.startsWith('/doctor')) {
          window.location.href = '/doctor';
        } else {
          window.location.href = '/auth/signin';
        }
      }
    }
    // 403 = permission issue, don't redirect — just reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;
