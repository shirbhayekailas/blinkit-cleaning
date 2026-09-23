// Utility to capture device GPS location for on-site verification
export function getGPSCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        verified: false,
        error: 'Geolocation is not supported by your browser or device.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          verified: true,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        let msg = 'Could not get GPS location.';
        if (error.code === 1) msg = 'Location access was denied. Please allow location permissions in your browser.';
        else if (error.code === 2) msg = 'Location unavailable (weak GPS inside basement / dark store).';
        else if (error.code === 3) msg = 'Location request timed out.';

        resolve({
          verified: false,
          error: msg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
