import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function HomePage() {
  const stats = [
    { label: "EMU Suburban Trains", value: "40+ Daily", icon: "🚆", color: "from-emerald-500 to-green-600" },
    { label: "PMPML Bus Routes", value: "350+ Routes", icon: "🚌", color: "from-orange-500 to-amber-600" },
    { label: "Pune Metro Stations", value: "30+ Stations", icon: "🚇", color: "from-purple-500 to-indigo-600" },
    { label: "MSRTC State Buses", value: "500+ Trips", icon: "🚍", color: "from-blue-500 to-cyan-600" }
  ];

  const features = [
    {
      title: "🧭 Smart Route Planner",
      desc: "Find the fastest transit routes between any two places across Pune, PCMC, and Talegaon with real-time transfer and fare estimates.",
      link: "/route-planner",
      linkText: "Open Route Planner",
      bg: "bg-orange-50 border-orange-200 text-orange-950",
      badge: "Fast & Multi-modal"
    },
    {
      title: "🕒 Real-time Timetables",
      desc: "Instant access to verified schedules for Pune Local Trains, PMPML buses, Pune Metro Lines, and MSRTC state buses.",
      link: "/timetables",
      linkText: "View Timetables",
      bg: "bg-blue-50 border-blue-200 text-blue-950",
      badge: "Live Schedules"
    },
    {
      title: "📍 Live GPS Tracking & Transit Map",
      desc: "Locate yourself in real time with GPS, discover nearest railway stations, bus stands, PMPML stops, and metro stations on an interactive map.",
      link: "/live-track",
      linkText: "Launch Live GPS Map",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-950",
      badge: "Real Coordinates"
    }
  ];

  const transitModes = [
    {
      mode: "Pune EMU Local Trains",
      icon: "🚆",
      coverage: "Pune Junction ⇄ Shivajinagar ⇄ Pimpri ⇄ Talegaon ⇄ Lonavala",
      frequency: "Every 30–45 mins",
      fare: "From ₹5 - ₹15",
      details: "Ideal for daily office commuters traveling between Pune City, PCMC industrial belt, and Talegaon/Lonavala."
    },
    {
      mode: "PMPML City Buses",
      icon: "🚌",
      coverage: "Extensive network covering Pune Station (Moledina Stand),Sancheti Hospital,Khadki Railway Station,Dapodi,Kasarwadi,Pimpri,Chinchwad,Nigdi Bus Stand, Dehu Road, Somatane Phata,Talegaon Dabhade Station /Maruti Mandir",
      frequency: "Every 5–15 mins",
      fare: "From ₹5 - ₹35",
      //details: "Affordable city connectivity with dedicated Rainbow BRTS corridors on Satara Road, Alandi Road, and Nagar Road."
    },
    {
      mode: "Pune Metro (Maha Metro)",
      icon: "🚇",
      coverage: "Purple Line (PCMC ⇄ Civil Court ⇄ Swargate) & Aqua Line (Vanaz ⇄ Ramwadi)",
      frequency: "Every 7–10 mins",
      fare: "From ₹10 - ₹35",
      details: "Rapid air-conditioned transit bypassing highway traffic, with major interchange hub at Civil Court."
    },
    {
      mode: "MSRTC State Transport",
      icon: "🚍",
      coverage: "Swargate, Shivajinagar, Chinchwad to all districts of Maharashtra",
      frequency: "Frequent daily departures",
      fare: "Variable by distance & bus type",
      details: "Long-distance & suburban connectivity including Shivneri AC, Shivshahi, and Ordinary Lal Dabba buses."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
            <span>ALL-IN-ONE PUNE PUBLIC TRANSIT PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Train, PMPL, Bus, Metro & MSRTC
            <br />
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 bg-clip-text text-transparent">
              ALL-IN-ONE PUNE TRANSIT SYSTEM
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong className="text-gray-900">TransitHub</strong> — your unified Pune & PCMC transit companion. No need to switch between multiple apps or websites. Get accurate routes, live timetables, and real-time GPS location tracking on an interactive map.
          </p>

          {/* PRIMARY CALL TO ACTION BUTTONS */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/route-planner"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition transform hover:-translate-y-0.5 flex items-center space-x-2 text-base cursor-pointer"
            >
              <span>🧭 Plan Your Route</span>
              <span>➔</span>
            </Link>

            <Link
              to="/timetables"
              className="bg-white hover:bg-orange-50 text-gray-800 border-2 border-gray-200 hover:border-orange-500 font-bold px-7 py-3.5 rounded-2xl shadow-sm hover:shadow transition transform hover:-translate-y-0.5 flex items-center space-x-2 text-base cursor-pointer"
            >
              <span>🕒 Transit Timetables</span>
            </Link>
          </div>
        </div>


        {/* STATS STRIP */}
        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center space-x-4 hover:shadow-md transition"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-2xl text-white shadow-sm flex-shrink-0`}>
                {item.icon}
              </div>
              <div>
                <div className="text-xl font-black text-gray-900">{item.value}</div>
                <div className="text-xs font-medium text-gray-500">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-orange-600 font-bold text-xs uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Dedicated Sections
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Everything You Need For Seamless Travel
          </h2>
          <p className="text-gray-600 text-base">
            TransitHub separates complex transit workflows into clear, specialized pages for fast performance and intuitive navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {feat.badge}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition">
                  {feat.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-8 mt-4 border-t border-gray-100">
                <Link
                  to={feat.link}
                  className="inline-flex items-center space-x-2 text-sm font-bold text-orange-600 hover:text-orange-700 group-hover:translate-x-1 transition"
                >
                  <span>{feat.linkText}</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TRANSITHUB WORKS */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              Quick Guide
            </span>
            <h2 className="text-3xl font-black">How TransitHub Works</h2>
            <p className="text-orange-100 text-sm">
              Connecting thousands of commuters with real-time transit intelligence every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-10 h-10 rounded-full bg-white text-orange-600 font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Choose Source & Destination</h3>
              <p className="text-orange-100 text-sm">
                Enter your start location (e.g. Talegaon Dabhade) and destination (e.g. Pune Junction or Hinjawadi) in the Route Planner.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-10 h-10 rounded-full bg-white text-orange-600 font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Compare Transit Modes</h3>
              <p className="text-orange-100 text-sm">
                View Local Trains, PMPML buses, Metro lines, and MSRTC state buses sorted by travel duration, departure timings, and ticket fares.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-10 h-10 rounded-full bg-white text-orange-600 font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Track GPS & Locate Stops</h3>
              <p className="text-orange-100 text-sm">
                Use the Live GPS Track page to view your current position on the map and find the closest railway station, bus stop, or metro station.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED TRANSIT MODES OVERVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-orange-600 font-bold text-xs uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Network Coverage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Pune & PCMC Public Transit Modes
          </h2>
          <p className="text-gray-600 text-base">
            Detailed information regarding the transit networks supported on TransitHub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transitModes.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-7 border border-gray-200 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{item.mode}</h3>
                  <span className="text-xs text-orange-600 font-semibold">{item.frequency}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <strong className="text-gray-900">Corridor / Routes:</strong> {item.coverage}
                </div>
                <div>
                  <strong className="text-gray-900">Typical Fare:</strong> {item.fare}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {item.details}
              </p>
            </div>
          ))}
        </div>
      </section>

     {/* CALL TO ACTION */}
      <section className="py-16 px-4 text-center max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-4">
          <h2 className="text-3xl font-black">Ready to Start Your Journey?</h2>
          <p className="text-orange-100 max-w-xl mx-auto text-base">
            Check live route options or explore timetables to find the fastest transport departures immediately.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/route-planner"
              className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow hover:bg-gray-100 transition cursor-pointer"
            >
              Open Route Planner
            </Link>
            <Link
              to="/timetables"
              className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl shadow hover:bg-black transition cursor-pointer"
            >
              View Timetables
            </Link>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
