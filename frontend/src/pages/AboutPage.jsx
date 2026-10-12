import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function AboutPage() {
  const stats = [
    { value: "4+", label: "Transit Modes", desc: "Local Trains, PMPML, Metro, MSRTC" },
    { value: "350+", label: "PMPML Routes", desc: "Covering PMC, PCMC & suburbs" },
    { value: "40+", label: "Daily Local Trains", desc: "Pune - Talegaon - Lonavala" },
    { value: "100%", label: "Free & Open Access", desc: "For all commuters & citizens" }
  ];

  const transitSystems = [
    {
      name: "Pune EMU Suburban Local Trains",
      icon: "🚆",
      badge: "Central Railway",
      description:
        "The lifeline for daily intercity commuters between Pune Junction, Shivajinagar, Khadki, Dapodi, Kasarwadi, Pimpri, Chinchwad, Akurdi, Dehu Road, Begdewadi, Ghorawadi, Talegaon, and Lonavala. High-capacity, cost-effective transit bypassing NH-48 highway bottlenecks.",
      features: [
        "Regular 12-car EMU rakes operating every 30-45 minutes",
        "Direct connection to PCMC industrial and IT employment hubs",
        "Most affordable transit: fares starting from ₹5 - ₹15"
      ]
    },
    {
      name: "PMPML City Buses & Rainbow BRTS",
      icon: "🚌",
      badge: "City Bus Service",
      description:
        "Pune Mahanagar Parivahan Mahamandal Ltd (PMPML) serves Pune and Pimpri-Chinchwad municipal regions. Features extensive coverage from Katraj, Hadapsar, Swargate, Hinjawadi IT Park, Kothrud, Warje, Nigdi, and Bhosari with dedicated Rainbow BRTS corridors.",
      features: [
        "Eco-friendly CNG and Electric e-Bus fleet",
        "Comprehensive connectivity across 350+ routes",
        "Special Rainbow BRTS high-speed corridors on major arterial roads"
      ]
    },
    {
      name: "Pune Metro (Maha Metro)",
      icon: "🚇",
      badge: "Mass Rapid Transit",
      description:
        "State-of-the-art modern rapid transit system developed by Maharashtra Metro Rail Corporation. Operates Purple Line 1 (PCMC to Swargate) and Aqua Line 2 (Vanaz to Ramwadi) with state-of-the-art interchange hub at Civil Court.",
      features: [
        "100% Air-conditioned, punctual trains every 7-10 minutes",
        "World-class Civil Court multi-tier underground & elevated interchange",
        "Seamless integration with feeder e-buses and metro stations"
      ]
    },
    {
      name: "MSRTC State Transport (ST)",
      icon: "🚍",
      badge: "Maharashtra State",
      description:
        "Maharashtra State Road Transport Corporation provides vital inter-district, rural, and regional transit connecting Pune's major bus terminals (Swargate, Shivajinagar, Vallabhnagar, Chinchwad, Pune Station) across Maharashtra.",
      features: [
        "Wide variety of services: Shivneri AC, Shivshahi, Ordinary Lal Dabba",
        "Extensive frequency on Pune-Mumbai, Pune-Nashik, Pune-Satara routes",
        "Vital link connecting satellite townships and rural areas"
      ]
    }
  ];

  const principles = [
    {
      title: "One Unified Platform",
      desc: "No need to juggle 4 separate apps or consult confusing static PDF timetables. Everything is accessible in one clean interface.",
      icon: "🎯"
    },
    {
      title: "Real-Time & Dynamic",
      desc: "Connects with live transit schedules and routes to provide up-to-date departure timings, journey durations, and stop sequences.",
      icon: "⚡"
    },
    {
      title: "Live GPS & Geospatial Intelligence",
      desc: "Interactive GIS map pinpoints your live location and discovers all nearest bus stands, metro stations, and railway stops instantly.",
      icon: "🗺️"
    },
    {
      title: "Commuter First Experience",
      desc: "Designed with responsive UI, dark/light contrast readability, and low data bandwidth consumption for on-the-go travelers.",
      icon: "🤝"
    }
  ];

  return (
    //<div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <div className="relative isolate w-full min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-clip">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <span>🚆 About TransitHub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Unifying Pune & PCMC
            <br />
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 bg-clip-text text-transparent">
              Public Transportation
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            TransitHub is dedicated to making public transit effortless, predictable, and stress-free for millions of daily commuters, students, and visitors across Pune, Pimpri-Chinchwad, and the industrial corridor.
          </p>

          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <Link
              to="/timetables"
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition"
            >
              🕒 Check Timetables
            </Link>
            <Link
              to="/route-planner"
              className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-sm px-6 py-3 rounded-2xl shadow-sm transition"
            >
              🧭 Plan Your Journey
            </Link>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm text-center"
            >
              <div className="text-3xl font-black text-orange-600 tracking-tight">
                {stat.value}
              </div>
              <div className="font-bold text-sm text-gray-900 mt-1">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION & VISION SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Why We Built TransitHub
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Pune has multiple world-class transit systems, but commuters previously had to navigate disjointed apps, outdated websites, and physical timetable boards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl mb-4">
                {p.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPORTED TRANSIT SYSTEMS */}
      <section className="bg-gradient-to-b from-gray-100/60 to-white py-16 px-4 sm:px-6 lg:px-8 border-y">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              <span>Transit Modes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Complete Multi-Modal Transit Coverage
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Our unified platform synchronizes schedules and routes across all four primary mass-transit pillars of Pune.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {transitSystems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm hover:border-orange-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {item.features.map((feat, fIdx) => (
                      <li
                        key={fIdx}
                        className="text-xs sm:text-sm text-gray-700 flex items-start space-x-2"
                      >
                        <span className="text-orange-500 font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/timetables"
                  className="w-full text-center bg-gray-50 hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-bold text-xs py-2.5 rounded-xl border border-gray-200 transition"
                >
                  View Timetables & Schedules ➔
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-orange-500/20">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">
            Ready to Travel Smarter Across Pune?
          </h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Get accurate departure schedules, route guidance, and live GPS map tracking right at your fingertips.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/timetables"
              className="bg-white text-orange-700 hover:bg-orange-50 font-black text-sm px-7 py-3.5 rounded-2xl shadow transition"
            >
              Explore Timetables Now
            </Link>
            <Link
              to="/live-track"
              className="bg-orange-700/60 hover:bg-orange-800/80 border border-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition"
            >
              📍 Track Live Location
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
