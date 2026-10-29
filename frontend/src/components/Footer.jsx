import React from "react";
import { Link } from "react-router-dom";
import TransitHublogo from "../assets/TransitHublogo.png";

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-gray-400 pt-16 pb-10 px-4 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* BRAND & INFO */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white text-lg">
              <img
                src={TransitHublogo}
                alt="TransitHub"
                className="w-50 h-50 rounded-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">TransitHub</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Pune & Pimpri-Chinchwad's all-in-one public transit platform. Seamlessly uniting EMU Local Trains, PMPML City Buses, Pune Metro, and MSRTC State Transport.
          </p>
          <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-950/60 border border-green-800/60 px-3 py-1.5 rounded-lg w-fit">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Live Transit API Connected</span>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">Navigation</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>🏠</span>
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/route-planner" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>🧭</span>
                <span>Route Planner</span>
              </Link>
            </li>
            <li>
              <Link to="/timetables" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>🕒</span>
                <span>Timetable</span>
              </Link>
            </li>
            <li>
              <Link to="/live-track" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>📍</span>
                <span>Track My Live Location</span>
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>ℹ️</span>
                <span>About</span>
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-orange-400 transition flex items-center space-x-1.5 cursor-pointer">
                <span>💬</span>
                <span>Contact</span>
              </Link>
            </li>
          </ul>
        </div>


        {/* TRANSIT MODES */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">Supported Transit Modes</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <span>🚆</span>
              <span>Pune Suburban Local Trains</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>🚌</span>
              <span>PMPML City & BRTS Buses</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>🚇</span>
              <span>Pune Metro (Purple & Aqua Lines)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>🚍</span>
              <span>MSRTC Maharashtra State Transport</span>
            </li>
          </ul>
        </div>

        {/* CONTACT & SECURITY */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">Security & Support</h4>
          <p className="text-xs text-gray-400 mb-3">
            Built with CSRF protections, rate limiting, and secure server-side API handling.
          </p>
          <div className="space-y-2 text-xs">
            <p className="flex items-center space-x-2">
              <span className="text-orange-400">📧</span>
              <span className="text-gray-300">support@transithub.in</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-orange-400">📍</span>
              <span className="text-gray-300">Pune & PCMC, Maharashtra</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} TransitHub. All rights reserved. Unified Pune Public Transport.</p>
        <p className="flex items-center space-x-4">
          <span>Safe & Secure</span>
          <span>•</span>
          <span>Real-time GPS Tracking</span>
          <span>•</span>
          <span>Dynamic API</span>
        </p>
      </div>
    </footer>
  );
}
