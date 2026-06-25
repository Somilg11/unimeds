'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access or enter your address manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please enter your address manually.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again or enter your address manually.';
            break;
        }
        setState({
          latitude: null,
          longitude: null,
          error: message,
          loading: false,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({ latitude: null, longitude: null, error: null, loading: false });
  }, []);

  return { ...state, requestLocation, clearLocation };
}
