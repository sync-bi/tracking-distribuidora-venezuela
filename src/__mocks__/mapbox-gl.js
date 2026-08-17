// Mock de mapbox-gl para las pruebas.
// El paquete real se distribuye en un bundle que jsdom no puede parsear, y
// además necesita WebGL, que no existe en el entorno de pruebas.

class Map {
  on() { return this; }
  off() { return this; }
  once() { return this; }
  remove() {}
  addControl() { return this; }
  removeControl() { return this; }
  getCanvas() { return { style: {} }; }
  setCenter() { return this; }
  setZoom() { return this; }
  flyTo() { return this; }
  fitBounds() { return this; }
  addSource() { return this; }
  removeSource() { return this; }
  addLayer() { return this; }
  removeLayer() { return this; }
  getLayer() { return null; }
  getSource() { return null; }
  resize() { return this; }
  project() { return { x: 0, y: 0 }; }
  unproject() { return { lng: 0, lat: 0 }; }
}

class Marker {
  setLngLat() { return this; }
  setPopup() { return this; }
  addTo() { return this; }
  remove() { return this; }
  getElement() { return document.createElement('div'); }
}

class Popup {
  setLngLat() { return this; }
  setHTML() { return this; }
  setDOMContent() { return this; }
  addTo() { return this; }
  remove() { return this; }
}

class NavigationControl {}
class LngLatBounds {
  extend() { return this; }
  isEmpty() { return false; }
}

const mapboxgl = {
  Map,
  Marker,
  Popup,
  NavigationControl,
  LngLatBounds,
  accessToken: '',
  supported: () => true
};

export default mapboxgl;
export { Map, Marker, Popup, NavigationControl, LngLatBounds };
