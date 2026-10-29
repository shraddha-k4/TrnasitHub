import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TransitHublogo from "../assets/TransitHublogo.png";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Route Planner", path: "/route-planner" },
    { name: "Timetable", path: "/timetables" },
    { name: "Track My Live Location", path: "/live-track" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" }
  ];

  const isActive = (path) => {
    if (path === "/" && (location.pathname === "/" || location.pathname === "/home")) return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO (LEFT SIDE) */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 group cursor-pointer flex-shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform cursor-pointer">
            <img
              src={TransitHublogo}
              alt="TransitHub"
              className="w-50 h-50 rounded-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="text-2xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent tracking-tight cursor-pointer">
              TransitHub
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wider">
              Pune Transit
            </span>
          </div>
        </Link>

        {/* ALL NAV HEADINGS ON THE RIGHT SIDE (DESKTOP) */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 ml-auto">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "text-gray-700 hover:text-orange-600 hover:bg-orange-50/80"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* MOBILE MENU TOGGLE BUTTON (RIGHT SIDE ON MOBILE) */}
        <div className="lg:hidden flex items-center ml-auto">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer focus:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-5 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  active
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
