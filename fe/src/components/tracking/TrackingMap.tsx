import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// We dynamically import leaflet and react-leaflet so it doesn't break SSR
export default function TrackingMap({
  history,
}: {
  history: Array<{ latitude: number | null; longitude: number | null; status_update: string }>;
}) {
  const [L, setL] = useState<any>(null);
  const [ReactLeaflet, setReactLeaflet] = useState<any>(null);

  useEffect(() => {
    // Only import in browser
    Promise.all([
      import("leaflet"),
      import("react-leaflet")
    ]).then(([leaflet, reactLeaflet]) => {
      // Fix missing marker icons in react-leaflet
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      setL(leaflet);
      setReactLeaflet(reactLeaflet);
    });
  }, []);

  if (!L || !ReactLeaflet) {
    return (
      <div className="h-64 w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center border border-border">
        <span className="text-sm text-muted-foreground font-medium">Memuat Peta...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Polyline, Popup } = ReactLeaflet;

  // Filter valid coordinates
  const validPoints = history
    .filter((h) => h.latitude !== null && h.longitude !== null)
    .map((h) => ({
      lat: h.latitude!,
      lng: h.longitude!,
      title: h.status_update,
    }));

  if (validPoints.length === 0) {
    return (
      <div className="h-64 w-full rounded-2xl bg-muted/50 flex flex-col items-center justify-center border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground font-medium">Data koordinat GPS belum tersedia.</p>
        <p className="text-xs text-muted-foreground mt-1">Peta akan muncul otomatis saat kurir merekam lokasi.</p>
      </div>
    );
  }

  const positions = validPoints.map(p => [p.lat, p.lng] as [number, number]);

  // Bounding box bounds
  const bounds = L.latLngBounds(positions);
  // Add some padding
  bounds.pad(0.1);

  return (
    <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-border shadow-sm z-0 relative">
      <MapContainer 
        bounds={bounds} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        boundsOptions={{ padding: [30, 30] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw Line connecting points */}
        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }} />
        )}

        {/* Draw Markers */}
        {validPoints.map((pt, i) => (
          <Marker key={i} position={[pt.lat, pt.lng]}>
            <Popup>
              <span className="font-semibold">{pt.title}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
