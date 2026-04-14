import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { WebView } from 'react-native-webview'

const FALLBACK_COORDINATE = {
  latitude: 28.6139,
  longitude: 77.209,
}

const normalizeCoordinate = (coordinate, fallback = FALLBACK_COORDINATE) => {
  const latitude = Number(coordinate?.latitude)
  const longitude = Number(coordinate?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return fallback
  }

  return { latitude, longitude }
}

const toFiniteNumber = (value, fallback) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const buildLeafletHtml = (initialConfig) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html,
      body,
      #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #e2e8f0;
      }

      .leaflet-control-attribution {
        font-size: 10px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>

    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>

    <script>
      const INITIAL_CONFIG = ${JSON.stringify(initialConfig)};
      const FALLBACK_CENTER = { latitude: 28.6139, longitude: 77.209 };

      let mapInstance = null;
      let markerInstance = null;
      let circleInstance = null;
      let currentConfig = INITIAL_CONFIG;
      let isInteracting = false;

      const postMessage = (payload) => {
        if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== "function") return;
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      };

      const normalizeCoordinate = (coordinate, fallback = FALLBACK_CENTER) => {
        const latitude = Number(coordinate && coordinate.latitude);
        const longitude = Number(coordinate && coordinate.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return fallback;
        }

        return { latitude, longitude };
      };

      const setInteractionState = (nextState) => {
        const normalizedState = Boolean(nextState);
        if (normalizedState === isInteracting) return;

        isInteracting = normalizedState;
        postMessage({
          type: "interaction",
          isInteracting,
        });
      };

      const updateCircle = (coordinate, radiusMeters) => {
        const safeRadius = Number(radiusMeters);

        if (!Number.isFinite(safeRadius) || safeRadius <= 0) {
          if (circleInstance) {
            circleInstance.remove();
            circleInstance = null;
          }
          return;
        }

        if (!circleInstance) {
          circleInstance = L.circle([coordinate.latitude, coordinate.longitude], {
            radius: safeRadius,
            color: "rgba(59, 130, 246, 0.7)",
            weight: 2,
            fillColor: "rgba(59, 130, 246, 0.18)",
            fillOpacity: 1,
          }).addTo(mapInstance);
          return;
        }

        circleInstance.setLatLng([coordinate.latitude, coordinate.longitude]);
        circleInstance.setRadius(safeRadius);
      };

      const attachMarkerDragListener = () => {
        if (!markerInstance) return;

        markerInstance.off("dragstart");
        markerInstance.off("dragend");
        markerInstance.on("dragstart", () => {
          setInteractionState(true);
        });
        markerInstance.on("dragend", (event) => {
          const latitude = event.target.getLatLng().lat;
          const longitude = event.target.getLatLng().lng;
          const nextCoordinate = { latitude, longitude };

          updateCircle(nextCoordinate, currentConfig.radiusMeters);
          setInteractionState(false);
          postMessage({
            type: "coordinate",
            latitude,
            longitude,
          });
        });
      };

      const updateMarker = (coordinate, draggable) => {
        if (currentConfig.showMarker === false) {
          if (markerInstance) {
            markerInstance.remove();
            markerInstance = null;
          }
          return;
        }

        if (!markerInstance) {
          markerInstance = L.marker([coordinate.latitude, coordinate.longitude], {
            draggable: Boolean(draggable),
          }).addTo(mapInstance);
          attachMarkerDragListener();
          return;
        }

        markerInstance.setLatLng([coordinate.latitude, coordinate.longitude]);

        if (markerInstance.dragging) {
          if (draggable) {
            markerInstance.dragging.enable();
          } else {
            markerInstance.dragging.disable();
          }
        }

        attachMarkerDragListener();
      };

      const setInteractivity = (enabled) => {
        const isEnabled = Boolean(enabled);

        const method = isEnabled ? "enable" : "disable";
        mapInstance.dragging[method]();
        mapInstance.touchZoom[method]();
        mapInstance.doubleClickZoom[method]();
        mapInstance.scrollWheelZoom[method]();
        mapInstance.boxZoom[method]();
        mapInstance.keyboard[method]();
        if (mapInstance.tap) mapInstance.tap[method]();
      };

      const applyConfig = (nextConfig) => {
        if (!mapInstance) return;

        currentConfig = {
          ...currentConfig,
          ...nextConfig,
        };

        const center = normalizeCoordinate(currentConfig.center, FALLBACK_CENTER);
        const markerCoordinate = normalizeCoordinate(currentConfig.coordinate, center);
        const zoom = Number.isFinite(Number(currentConfig.zoom))
          ? Number(currentConfig.zoom)
          : mapInstance.getZoom();

        mapInstance.setView([center.latitude, center.longitude], zoom, {
          animate: false,
        });

        setInteractivity(currentConfig.interactive);
        updateMarker(markerCoordinate, currentConfig.draggable);
        updateCircle(markerCoordinate, currentConfig.radiusMeters);
      };

      const initializeMap = () => {
        const center = normalizeCoordinate(INITIAL_CONFIG.center, FALLBACK_CENTER);

        mapInstance = L.map("map", {
          zoomControl: true,
          attributionControl: true,
          dragging: Boolean(INITIAL_CONFIG.interactive),
          touchZoom: Boolean(INITIAL_CONFIG.interactive),
          doubleClickZoom: Boolean(INITIAL_CONFIG.interactive),
          scrollWheelZoom: Boolean(INITIAL_CONFIG.interactive),
          boxZoom: Boolean(INITIAL_CONFIG.interactive),
          keyboard: Boolean(INITIAL_CONFIG.interactive),
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapInstance);

        mapInstance.setView([center.latitude, center.longitude], Number(INITIAL_CONFIG.zoom) || 15, {
          animate: false,
        });

        const mapContainer = mapInstance.getContainer();
        const interactionStartEvents = ["touchstart", "mousedown", "pointerdown"];
        const interactionEndEvents = ["touchend", "mouseup", "pointerup", "touchcancel", "mouseleave"];

        interactionStartEvents.forEach((eventName) => {
          mapContainer.addEventListener(eventName, () => {
            setInteractionState(true);
          }, { passive: true });
        });

        interactionEndEvents.forEach((eventName) => {
          mapContainer.addEventListener(eventName, () => {
            setInteractionState(false);
          }, { passive: true });
        });

        mapInstance.on("movestart", () => {
          setInteractionState(true);
        });

        mapInstance.on("moveend", () => {
          setInteractionState(false);
        });

        mapInstance.on("zoomstart", () => {
          setInteractionState(true);
        });

        mapInstance.on("zoomend", () => {
          setInteractionState(false);
        });

        mapInstance.on("click", (event) => {
          if (!currentConfig.interactive) return;

          const latitude = event.latlng.lat;
          const longitude = event.latlng.lng;
          const nextCoordinate = { latitude, longitude };

          updateMarker(nextCoordinate, currentConfig.draggable);
          updateCircle(nextCoordinate, currentConfig.radiusMeters);

          postMessage({
            type: "coordinate",
            latitude,
            longitude,
          });
        });

        applyConfig(INITIAL_CONFIG);

        window.__rnMapApplyConfig = (configUpdate) => {
          applyConfig(configUpdate || {});
        };

        postMessage({ type: "ready" });
      };

      initializeMap();
    </script>
  </body>
</html>
`

export default function OpenStreetMapView({
  center,
  coordinate,
  height = 250,
  zoom = 15,
  radiusMeters = 0,
  interactive = false,
  draggable = false,
  showMarker = true,
  onCoordinateChange,
  onMapInteractionChange,
}) {
  const webViewRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const safeCenter = useMemo(
    () => normalizeCoordinate(center, FALLBACK_COORDINATE),
    [center?.latitude, center?.longitude]
  )

  const safeCoordinate = useMemo(
    () => normalizeCoordinate(coordinate, safeCenter),
    [coordinate?.latitude, coordinate?.longitude, safeCenter]
  )

  const runtimeConfig = useMemo(
    () => ({
      center: safeCenter,
      coordinate: safeCoordinate,
      zoom: toFiniteNumber(zoom, 15),
      radiusMeters: toFiniteNumber(radiusMeters, 0),
      interactive: Boolean(interactive),
      draggable: Boolean(draggable),
      showMarker: Boolean(showMarker),
    }),
    [draggable, interactive, radiusMeters, safeCenter, safeCoordinate, showMarker, zoom]
  )

  const initialConfigRef = useRef(runtimeConfig)

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return

    webViewRef.current.injectJavaScript(
      `window.__rnMapApplyConfig && window.__rnMapApplyConfig(${JSON.stringify(runtimeConfig)}); true;`
    )
  }, [isMapReady, runtimeConfig])

  const handleMessage = (event) => {
    try {
      const payload = JSON.parse(event?.nativeEvent?.data || '{}')

      if (payload?.type === 'ready') {
        setIsMapReady(true)
        return
      }

      if (payload?.type === 'interaction') {
        if (typeof onMapInteractionChange === 'function') {
          onMapInteractionChange(Boolean(payload?.isInteracting))
        }
        return
      }

      if (payload?.type !== 'coordinate') return

      const latitude = Number(payload?.latitude)
      const longitude = Number(payload?.longitude)

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return
      }

      if (typeof onCoordinateChange === 'function') {
        onCoordinateChange({ latitude, longitude })
      }
    } catch (_error) {
      // Ignore malformed WebView messages from injected script.
    }
  }

  return (
    <View style={{ width: '100%', height }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: buildLeafletHtml(initialConfigRef.current) }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  )
}
