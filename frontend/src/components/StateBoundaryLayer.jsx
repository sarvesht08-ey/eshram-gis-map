import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const StateBoundaryLayer = () => {
  const map = useMap();

  useEffect(() => {
    let geoJsonLayer;

    fetch("/StateBoundary.geojson") // place file in public/
      .then((res) => res.json())
      .then((geojson) => {
        geoJsonLayer = L.geoJSON(geojson, {
          style: {
            color: "#2563eb", // blue-600
            weight: 1,
            fillOpacity: 0,
          },
          onEachFeature: (feature, layer) => {
            const stateName = feature.properties?.STATE;

            if (stateName) {
              layer.bindTooltip(stateName, {
                permanent: true,
                direction: "center",
                className: "state-label",
              });
            }
          },
        });

        geoJsonLayer.addTo(map);
      });

    return () => {
      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
      }
    };
  }, [map]);

  return null;
};

export default StateBoundaryLayer;
