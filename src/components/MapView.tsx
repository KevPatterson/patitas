import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router";
import type { PublicationCard } from "@contracts/patitas";
import { typeColor, typeLabel, speciesLabel, locationLabel } from "@/lib/patitas";

const CUBA_CENTER: [number, number] = [21.9, -79.5];

function markerIcon(color: string) {
  return L.divIcon({
    className: "patitas-marker",
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${color};
      border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

export function MapView({ pubs, height = "70vh" }: { pubs: PublicationCard[]; height?: string }) {
  const withCoords = pubs.filter((p) => p.approxLat != null && p.approxLng != null);
  const center: [number, number] =
    withCoords.length > 0
      ? [withCoords[0].approxLat!, withCoords[0].approxLng!]
      : CUBA_CENTER;
  return (
    <div style={{ height }} className="rounded-3xl overflow-hidden border border-border">
      <MapContainer center={center} zoom={withCoords.length ? 11 : 7} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((p) => (
          <Marker key={p.slug} position={[p.approxLat!, p.approxLng!]} icon={markerIcon(p.status === "resolved" ? "#2F9E63" : typeColor(p.type))}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} />
                )}
                <strong style={{ display: "block", marginTop: 6 }}>
                  {p.petName || "Sin nombre"}
                </strong>
                <span style={{ fontSize: 13 }}>
                  {speciesLabel(p.species)} · {p.status === "resolved" ? "Resuelto" : typeLabel(p.type)}
                </span>
                <br />
                <span style={{ fontSize: 12, color: "#777" }}>📍 {locationLabel(p)}</span>
                <br />
                <Link to={`/p/${p.slug}`} style={{ color: "#E4572E", fontWeight: 700, fontSize: 13 }}>
                  Ver publicación →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  height = "320px",
}: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: string;
}) {
  return (
    <div style={{ height }} className="rounded-3xl overflow-hidden border border-border">
      <MapContainer center={value ? [value.lat, value.lng] : [23.1136, -82.3666]} zoom={value ? 14 : 12} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && <Marker position={[value.lat, value.lng]} icon={markerIcon("#E4572E")} />}
      </MapContainer>
    </div>
  );
}
