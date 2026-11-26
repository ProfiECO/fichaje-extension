export function position() {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () =>
        reject(
          new Error(
            'No se pudo obtener la ubicación obligatoria. Revisa el permiso de ubicación y vuelve a intentarlo.',
          ),
        ),
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
    ),
  );
}
