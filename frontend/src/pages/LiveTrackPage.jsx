import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getallTransitRoutes } from "../api/apiendpoint.jsx";

// Haversine distance in km
const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Nearest stops from a list (adds distanceKm and walkTimeMin, ~5 km/h walking)
const getNearestTransitStops = (stops, lat, lng, limit = 6) => {
  return stops
    .map((stop) => {
      const d = calculateDistanceKm(lat, lng, stop.lat, stop.lng);
      return {
        ...stop,
        distanceKm: Math.round(d * 100) / 100,
        walkTimeMin: Math.max(1, Math.round((d / 5) * 60))
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};

export default function LiveTrackPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const watchIdRef = useRef(null);

  // Default initial center: Pune City Center
  const defaultCenter = [18.5204, 73.8567];

  // States
  const [transitStops, setTransitStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // prompt | granted | denied | requesting
//   const [trackingStatus, setTrackingStatus] = useState("Location permission required to track live position.");
  const [trackingStatus, setTrackingStatus] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [nearestStops, setNearestStops] = useState([]);

  // ==========================================
  // FETCH TRANSIT STOPS FROM BACKEND
  // ==========================================
  useEffect(() => {
    let cancelled = false;

    const fetchTransitStops = async () => {
      try {
        const res = await fetch(getallTransitRoutes);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Support: [ ... ] | { data: [ ... ] } | { stops: [ ... ] } | { transitStops: [ ... ] }
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.stops)
          ? json.stops
          : Array.isArray(json?.transitStops)
          ? json.transitStops
          : [];

        const cleaned = list
          .filter(
            (s) =>
              s &&
              typeof s.lat === "number" &&
              typeof s.lng === "number" &&
              !Number.isNaN(s.lat) &&
              !Number.isNaN(s.lng)
          )
          .map((s) => ({
            ...s,
            id: s.id || s._id,
            name: s.name || "",
            shortName: s.shortName || s.name || "",
            address: s.address || "",
            category: s.category || "",
            lines: Array.isArray(s.lines) ? s.lines : [],
            facilities: Array.isArray(s.facilities) ? s.facilities : []
          }));

        if (!cancelled) setTransitStops(cleaned);
      } catch (err) {
        console.error("Failed to load transit stops:", err);
        if (!cancelled) {
          setTrackingStatus("Unable to load transit stops from the server. Please try again later.");
        }
      }
    };

    fetchTransitStops();
    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // CUSTOM LEAFLET PIN ICONS
  // ==========================================
  const createCustomIcon = (type) => {
    let bg = "bg-orange-500";
    let icon = "📍";
    let border = "border-white";

    if (type === "train") {
      bg = "bg-emerald-600";
      icon = "🚆";
    } else if (type === "msrtc") {
      bg = "bg-blue-600";
      icon = "🚍";
    } else if (type === "pmpl") {
      bg = "bg-orange-500";
      icon = "🚏";
    } else if (type === "metro") {
      bg = "bg-purple-600";
      icon = "🚇";
    } else if (type === "user") {
      bg = "bg-blue-500";
      icon = "👤";
      border = "border-white ring-4 ring-blue-400/50 animate-pulse";
    }

    return L.divIcon({
      className: "custom-transit-marker",
      html: `
        <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid white; font-size: 16px;" class="${bg} ${border}">
          ${icon}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });
  };

  // ==========================================
  // INITIALIZE MAP
  // ==========================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false
      });

      // OpenStreetMap Standard Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add Zoom control on top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Layer group for transit stop markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    renderTransitMarkers();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update nearest stops whenever userLocation or loaded stops update
  useEffect(() => {
    if (userLocation && transitStops.length > 0) {
      const nearest = getNearestTransitStops(transitStops, userLocation.lat, userLocation.lng, 6);
      setNearestStops(nearest);
    }
  }, [userLocation, transitStops]);

  // Rerender transit markers when filter changes or stops finish loading
  useEffect(() => {
    renderTransitMarkers();
  }, [selectedCategory, transitStops]);

  // ==========================================
  // RENDER TRANSIT MARKERS
  // ==========================================
  const renderTransitMarkers = () => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    const filtered = transitStops.filter(
      (stop) => selectedCategory === "all" || stop.type === selectedCategory
    );

    filtered.forEach((stop) => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createCustomIcon(stop.type)
      });

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; max-width: 270px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 18px;">${
              stop.type === "train"
                ? "🚆"
                : stop.type === "msrtc"
                ? "🚍"
                : stop.type === "pmpl"
                ? "🚏"
                : "🚇"
            }</span>
            <strong style="font-size: 14px; color: #111827; line-height: 1.2;">${stop.name}</strong>
          </div>
          <div style="display: inline-block; font-size: 11px; font-weight: bold; background: #FFF7ED; color: #C2410C; padding: 2px 8px; border-radius: 999px; margin-bottom: 8px;">
            ${stop.category}
          </div>
          <p style="font-size: 11px; color: #4B5563; margin-bottom: 6px; line-height: 1.3;">
            📍 ${stop.address}
          </p>
          <div style="font-size: 11px; color: #374151; margin-bottom: 8px; background: #F3F4F6; padding: 6px; border-radius: 8px;">
            <strong>Lines / Routes:</strong> ${(stop.lines || []).join(", ")}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="/route-planner?from=${encodeURIComponent(
              stop.shortName
            )}" style="display: block; text-align: center; flex: 1; background: #EA580C; color: white; padding: 5px; border-radius: 6px; font-size: 11px; font-weight: bold; text-decoration: none;">
              Plan From Here
            </a>
            <a href="/route-planner?to=${encodeURIComponent(
              stop.shortName
            )}" style="display: block; text-align: center; flex: 1; background: #1F2937; color: white; padding: 5px; border-radius: 6px; font-size: 11px; font-weight: bold; text-decoration: none;">
              Plan To Here
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => setSelectedStop(stop));
      markersLayerRef.current.addLayer(marker);
    });
  };

  // ==========================================
  // REQUEST USER GEOLOCATION PERMISSION & TRACK
  // ==========================================
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setPermissionStatus("denied");
      setTrackingStatus("Geolocation is not supported by your browser.");
      return;
    }

    setPermissionStatus("requesting");
    // setTrackingStatus("Requesting location access from your browser...");

    // First, get immediate position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos, true);
        startWatchingLocation();
      },
      (err) => {
        handlePositionError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startWatchingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionSuccess(pos, false),
      (err) => handlePositionError(err),
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      }
    );
  };

  const handlePositionSuccess = (position, shouldCenter = true) => {
    const { latitude, longitude, accuracy: acc } = position.coords;
    const userCoords = { lat: latitude, lng: longitude };

    setUserLocation(userCoords);
    setAccuracy(Math.round(acc));
    setPermissionStatus("granted");
    // setTrackingStatus(
    //   `Live GPS Active: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Accuracy ±${Math.round(
    //     acc
    //   )}m)`
    // );

    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Update or create User Marker
    if (!userMarkerRef.current) {
      const userMarker = L.marker([latitude, longitude], {
        icon: createCustomIcon("user"),
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; text-align: center;">
          <strong style="font-size: 14px; color: #2563EB;">📍 You Are Here</strong>
          <p style="font-size: 11px; color: #4B5563; margin-top: 4px;">
            Latitude: ${latitude.toFixed(5)}<br/>
            Longitude: ${longitude.toFixed(5)}<br/>
            Accuracy: ±${Math.round(acc)}m
          </p>
        </div>
      `);
      userMarkerRef.current = userMarker;
    } else {
      userMarkerRef.current.setLatLng([latitude, longitude]);
    }

    // Update Accuracy Circle
    if (!userAccuracyCircleRef.current) {
      const circle = L.circle([latitude, longitude], {
        radius: acc || 40,
        color: "#3B82F6",
        fillColor: "#93C5FD",
        fillOpacity: 0.25,
        weight: 1.5
      }).addTo(map);
      userAccuracyCircleRef.current = circle;
    } else {
      userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
      userAccuracyCircleRef.current.setRadius(acc || 40);
    }

    // Center map on user if requested
    if (shouldCenter || isFollowingUser) {
      map.flyTo([latitude, longitude], 15, { duration: 1.5 });
    }
  };

  const handlePositionError = (error) => {
    console.warn("Geolocation Error:", error.message);
    setPermissionStatus("denied");

    if (error.code === 1) {
      setTrackingStatus(
        "Location permission denied. Please allow location access in your browser settings to track live GPS."
      );
    } else if (error.code === 2) {
      setTrackingStatus("Position unavailable. Trying to acquire GPS signal...");
    } else if (error.code === 3) {
      setTrackingStatus("Location request timed out. Retrying...");
    } else {
      setTrackingStatus("Unable to determine your current location.");
    }
  };

  // Recenter map on user position
  const recenterOnUser = () => {
    if (!userLocation || !mapInstanceRef.current) {
      requestLocationPermission();
      return;
    }
    setIsFollowingUser(true);
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
    if (userMarkerRef.current) {
      userMarkerRef.current.openPopup();
    }
  };

  // Zoom into a specific stop
  const focusOnStop = (stop) => {
    if (!mapInstanceRef.current) return;
    setSelectedStop(stop);
    setIsFollowingUser(false);
    mapInstanceRef.current.flyTo([stop.lat, stop.lng], 16, { duration: 1.2 });

    // Open popup for this stop
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer) => {
        const latlng = layer.getLatLng();
        if (
          Math.abs(latlng.lat - stop.lat) < 0.0001 &&
          Math.abs(latlng.lng - stop.lng) < 0.0001
        ) {
          layer.openPopup();
        }
      });
    }
  };

  // Handle Search Input
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const q = val.toLowerCase().trim();
    const matches = transitStops
      .filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.shortName || "").toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q)
      )
      .slice(0, 8);

    setSearchResults(matches);
  };

  // Perform OpenStreetMap Nominatim search if no local stop matches
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchResults.length > 0) {
      focusOnStop(searchResults[0]);
      setSearchResults([]);
      return;
    }

    try {
      setTrackingStatus(`Searching location "${searchQuery}" on OpenStreetMap...`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + " Pune Maharashtra"
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lon], 15, { duration: 1.2 });
          L.popup()
            .setLatLng([lat, lon])
            .setContent(
              `<div style="font-family: inherit;"><strong>📍 ${place.display_name}</strong></div>`
            )
            .openOn(mapInstanceRef.current);
        }
        setTrackingStatus(`Map centered on: ${place.display_name.split(",")[0]}`);
      } else {
        setTrackingStatus(`No location found for "${searchQuery}".`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar />

      {/* HEADER SECTION */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
              <span>Interactive Real GPS Tracker</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              📍 Live GPS Tracking & Transit Map
            </h1>
            <p className="text-gray-600 text-sm mt-1 max-w-xl">
              Track your real position, search stops, and explore real railway stations, bus stations, PMPML stops, and metro stations.
            </p>
          </div>

          {/* PERMISSION / ACTION BUTTON */}
          <div className="flex flex-wrap items-center gap-3">
            {permissionStatus !== "granted" ? (
              <button
                onClick={requestLocationPermission}
                disabled={permissionStatus === "requesting"}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{permissionStatus === "requesting" ? "⏳" : "📍"}</span>
                <span>
                  {permissionStatus === "requesting"
                    ? "Requesting Access..."
                    : "Allow Permission & Track GPS"}
                </span>
              </button>
            ) : (
              <button
                onClick={recenterOnUser}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center space-x-2 text-sm"
              >
                <span>🎯</span>
                <span>Center on My Location</span>
              </button>
            )}
          </div>
        </div>

        {/* STATUS BAR */}
       </section>

      {/* MAP CONTROLS & SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* SEARCH BAR WITH DROPDOWN */}
          <div className="relative flex-1 max-w-xl">
            <form onSubmit={handleAddressSearch} className="flex items-center">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search station or stop (e.g. Talegaon, Swargate, Civil Court)..."
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-gray-300 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute inset-y-0 right-14 pr-2 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute inset-y-1 right-1 px-3 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition"
                >
                  Find
                </button>
              </div>
            </form>

            {/* AUTOCOMPLETE DROPDOWN */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-[1000] max-h-72 overflow-y-auto divide-y divide-gray-100">
                {searchResults.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      focusOnStop(stop);
                      setSearchResults([]);
                      setSearchQuery(stop.name);
                    }}
                    className="p-3 hover:bg-orange-50 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {stop.type === "train"
                          ? "🚆"
                          : stop.type === "msrtc"
                          ? "🚍"
                          : stop.type === "pmpl"
                          ? "🚏"
                          : "🚇"}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{stop.name}</div>
                        <div className="text-xs text-gray-500">{stop.category} • {stop.address}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600">View ➔</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TRANSIT CATEGORY FILTER PILLS */}
          <div className="flex items-center gap-1.5 bg-gray-200/80 p-1.5 rounded-2xl overflow-x-auto no-scrollbar whitespace-nowrap">
            {[
                { id: "all", label: "All Transit", icon: "🌐" },
                { id: "train", label: "Railway Stations", icon: "🚆" },
                { id: "msrtc", label: "MSRTC Stands", icon: "🚍" },
                { id: "pmpl", label: "PMPML Stops", icon: "🚏" },
                { id: "metro", label: "Pune Metro", icon: "🚇" }
            ].map((tab) => (
                <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
                    selectedCategory === tab.id
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-700 hover:text-black"
                }`}
                >
                <span className="text-[10px]">{tab.icon}</span>
                <span>{tab.label}</span>
                </button>
            ))}
            </div>
        </div>
      </section>

      {/* MAP & SIDEBAR GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* INTERACTIVE MAP CONTAINER */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden relative flex flex-col min-h-[560px]">
            {/* FLOATING ACTION OVERLAY */}
            <div className="absolute top-4 left-4 z-[999] flex flex-col gap-2">
              <button
                onClick={recenterOnUser}
                title="Locate me / Recenter on GPS"
                className="bg-white/95 hover:bg-white text-gray-800 p-3 rounded-2xl shadow-lg border border-gray-200 flex items-center space-x-2 text-xs font-bold hover:scale-105 active:scale-95 transition"
              >
                <span className="text-base">🎯</span>
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>

            {/* MAP LEGEND OVERLAY */}
            <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200 text-xs hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 border border-white"></span>
                <span className="font-semibold text-gray-700">You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
                <span className="font-semibold text-gray-700">Train</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-white"></span>
                <span className="font-semibold text-gray-700">MSRTC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 border border-white"></span>
                <span className="font-semibold text-gray-700">PMPML</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 border border-white"></span>
                <span className="font-semibold text-gray-700">Metro</span>
              </div>
            </div>

            {/* LEAFLET CANVAS */}
            <div
              ref={mapContainerRef}
              className="w-full flex-grow min-h-[560px] z-0"
              style={{ minHeight: "560px" }}
            />
          </div>

          {/* SIDEBAR: NEAREST STOPS & INFO */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            {/* PERMISSION CARD IF NOT GRANTED */}
            {permissionStatus !== "granted" && (
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-md space-y-3">
                <div className="text-3xl">📍</div>
                <h3 className="font-bold text-lg leading-tight">Enable Live GPS Tracking</h3>
                <p className="text-xs text-orange-100 leading-relaxed">
                  Allow browser location access to see your real-time position on the map and discover the closest transport stops.
                </p>
                <button
                  onClick={requestLocationPermission}
                  className="w-full bg-white text-orange-600 font-extrabold py-2.5 rounded-xl text-xs shadow hover:bg-gray-100 transition"
                >
                  Grant Location Permission
                </button>
              </div>
            )}

            {/* NEAREST STOPS PANEL */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex-grow flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b mb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <span>🧭</span>
                  <span>{userLocation ? "Nearest To You" : "Featured Transit Stops"}</span>
                </h3>
                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {userLocation ? "GPS Calculated" : "Pune City"}
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
                {(userLocation && nearestStops.length > 0 ? nearestStops : transitStops.slice(0, 6)).map(
                  (stop) => (
                    <div
                      key={stop.id}
                      onClick={() => focusOnStop(stop)}
                      className="p-3 rounded-2xl bg-gray-50 hover:bg-orange-50/70 border border-gray-200/80 cursor-pointer transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">
                            {stop.type === "train"
                              ? "🚆"
                              : stop.type === "msrtc"
                              ? "🚍"
                              : stop.type === "pmpl"
                              ? "🚏"
                              : "🚇"}
                          </span>
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 group-hover:text-orange-600 transition leading-snug">
                              {stop.shortName}
                            </h4>
                            <span className="text-[10px] text-gray-500">{stop.category}</span>
                          </div>
                        </div>

                        {stop.distanceKm !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-black text-emerald-600">
                              {stop.distanceKm} km
                            </span>
                            <div className="text-[10px] text-gray-400">~{stop.walkTimeMin}m walk</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 truncate max-w-[140px]">{stop.address.split(",")[0]}</span>
                        <Link
                          to={`/route-planner?from=${encodeURIComponent(stop.shortName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-orange-600 hover:text-orange-700"
                        >
                          Plan Route ➔
                        </Link>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}