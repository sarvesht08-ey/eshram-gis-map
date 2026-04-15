import React, { useEffect, useRef, useState } from "react";

// Note: Since 'react-leaflet' and 'leaflet' packages are not available in this environment,
// we load the Leaflet libraries dynamically from a CDN.

const AGE_COLORS = {
  "Age 18-25": "#3b82f6", // Blue
  "Age 25-40": "#10b981", // Emerald
  "Age 40-60": "#8b5cf6", // Violet
  "Multiple": "#3b82f6"   // Default Blue
};

const MapComponent = ({ data, viewMode = "markers" }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  // Store heatmap layer
  const heatLayerRef = useRef(null);
  const stateLayerRef = useRef(null);
  const [libLoaded, setLibLoaded] = useState(false);

  // 1. Load Leaflet and MarkerCluster Libraries dynamically
  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Load CSS
        const cssUrls = [
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
          "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css",
          "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css",
        ];
        cssUrls.forEach((url) => {
          if (!document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = url;
            document.head.appendChild(link);
          }
        });

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load MarkerCluster JS
        if (!window.L.MarkerClusterGroup) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load Leaflet Heat JS
        if (!window.L.heatLayer) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        setLibLoaded(true);
      } catch (error) {
        console.error("Error loading Leaflet libraries:", error);
      }
    };

    loadScripts();
  }, []);

  // 2. Initialize Map and State Boundary Layer
  useEffect(() => {
    if (!libLoaded || !mapContainerRef.current || mapInstanceRef.current)
      return;

    const L = window.L;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5); // Central India

    // Add Tile Layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    // Fetch and Add State Boundary Layer
    fetch("StateBoundary.geojson")
      .then((res) => res.json())
      .then((geoData) => {
        if (stateLayerRef.current) {
          map.removeLayer(stateLayerRef.current);
        }

        const layer = L.geoJSON(geoData, {
          style: function () {
            return {
              color: "#F4A460", // Sandy Brown
              weight: 1.5,
              fillOpacity: 0.05,
            };
          },
          onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.STATE) {
              layer.bindTooltip(feature.properties.STATE, {
                sticky: true,
                direction: "center",
                className: "state-label",
              });
            }
          },
        });

        layer.addTo(map);
        stateLayerRef.current = layer;
      })
      .catch((err) =>
        console.log(
          "StateBoundary.geojson could not be loaded:",
          err
        )
      );

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [libLoaded]);

  // 3. Handle Markers/Heatmap and Data Updates
  useEffect(() => {
    if (!mapInstanceRef.current || !libLoaded || !data) return;

    const map = mapInstanceRef.current;
    const L = window.L;

    // Helper for Indian Number Formatting
    const formatNumber = (num) => {
        return (parseFloat(num) || 0).toLocaleString('en-IN');
    };

    // Cleanup Markers
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }
    // Cleanup Heatmap
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const bounds = [];
    const validData = data.filter((d) => d.Latitude && d.Longitude);

    if (viewMode === "heatmap") {
      // Create Heatmap
      const points = validData.map((item) => {
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);
        // Use Total Worker for intensity
        const intensity = Math.min((parseFloat(item["Total Worker"]) || 0) / 1000, 1.0); 
        bounds.push([lat, lng]);
        return [lat, lng, intensity];
      });

      const layer = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.2: "blue",
          0.4: "cyan",
          0.6: "lime",
          0.8: "yellow",
          1.0: "red"
        },
      });

      layer.addTo(map);
      heatLayerRef.current = layer;

    } else {
      // PREPARE MARKERS
      const markers = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        maxClusterRadius: 50,
      });

      validData.forEach((item) => {
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);
        bounds.push([lat, lng]);

        // Standard Blue Color
        const color = "#3b82f6";

        const icon = L.divIcon({
          className: "custom-marker-icon",
          html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([lat, lng], { icon: icon });

        // Tooltip Content
        const popupContent = `
            <div class="p-1 min-w-[200px] font-sans">
                <h3 class="font-bold text-lg mb-2 text-slate-900 border-b border-gray-200 pb-1 align-baseline">
                   ${item["Location Name"] || "Unknown"}
                   <span class="text-sm text-slate-700 font-normal ml-2">(${item["PIN code"] || ""})</span>
                </h3>
                <div class="space-y-1.5 text-sm text-slate-700">
                  <div class="flex justify-between"><span class="font-semibold text-slate-600">Total Worker:</span> <span class="font-bold text-slate-900">${formatNumber(item["Total Worker"])}</span></div>
                  <div class="flex justify-between"><span class="font-semibold text-slate-600">Male Worker:</span> <span>${formatNumber(item["Male Worker"])}</span></div>
                  <div class="flex justify-between"><span class="font-semibold text-slate-600">Female Worker:</span> <span>${formatNumber(item["Female Worker"])}</span></div>
                  
                  <div class="mt-2 pt-2 border-t border-dashed border-gray-200">
                    <div class="text-xs font-bold text-slate-500 uppercase mb-1">Age Distribution</div>
                    <div class="flex justify-between"><span class="text-slate-600">18 - 25:</span> <span class="font-medium">${formatNumber(item["Age 18-25"])}</span></div>
                    <div class="flex justify-between"><span class="text-slate-600">25 - 40:</span> <span class="font-medium">${formatNumber(item["Age 25-40"])}</span></div>
                    <div class="flex justify-between"><span class="text-slate-600">40 - 60:</span> <span class="font-medium">${formatNumber(item["Age 40-60"])}</span></div>
                  </div>

                  <div class="mt-2 pt-2 border-t border-gray-100 flex justify-end text-sm text-slate-400">
                    <span>${item["State"] || ""}</span>
                  </div>
                </div>
            </div>
            `;

        marker.bindPopup(popupContent, { className: "custom-popup" });
        markers.addLayer(marker);
      });

      map.addLayer(markers);
      markersLayerRef.current = markers;
    }

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data, libLoaded, viewMode]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div ref={mapContainerRef} className="w-full h-full z-0 outline-none" />
    </div>
  );
};

export default MapComponent;
