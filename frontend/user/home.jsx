import React, { useState, useEffect } from 'react';

export default function TransitHub() {
  const [source, setSource] = useState('Talegaon Dabhade');
  const [destination, setDestination] = useState('Pune Junction');
  const [activeTab, setActiveTab] = useState('directions'); // directions | lines
  const [selectedMode, setSelectedMode] = useState('all'); // all | train | pmpl | metro | msrtc
  const [searched, setSearched] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('');
  const [selectedTimetableMode, setSelectedTimetableMode] = useState('train');

  // Sample Train Data from previous extract
  const trainData = [
    { number: "17613", name: "Hazur Sahib Nanded Express", dep: "06:10 PM", arr: "07:15 PM", duration: "1hr 05min", runs: "Daily" },
    { number: "99821", name: "Lonavala - Pune Local", dep: "07:25 PM", arr: "08:32 PM", duration: "1hr 07min", runs: "Daily" },
    { number: "99825", name: "Lonavala - Pune Local", dep: "09:06 PM", arr: "10:00 PM", duration: "54min", runs: "Daily" },
    { number: "99827", name: "Lonavala - Pune Local", dep: "10:06 PM", arr: "11:00 PM", duration: "54min", runs: "Daily" },
    { number: "99829", name: "Lonavala - Pune Local", dep: "10:31 PM", arr: "11:25 PM", duration: "54min", runs: "Daily" },
    { number: "99831", name: "Lonavala - Pune Local", dep: "10:59 PM", arr: "11:50 PM", duration: "51min", runs: "Daily" }
  ];

  // Route Options Results
  const routeOptions = [
    {
      id: 1,
      type: 'train',
      title: 'Local Train (Direct)',
      badge: 'Fastest & Cheapest',
      badgeColor: 'bg-green-100 text-green-800',
      duration: '54 min',
      changes: 0,
      price: '₹10',
      frequency: 'Every 30-45 mins',
      steps: [
        'Walk to Talegaon Railway Station (5 min)',
        'Board Lonavala - Pune Local (Train #99825)',
        'Arrive at Pune Junction Station'
      ]
    },
    {
      id: 2,
      type: 'pmpl',
      title: 'PMPL Bus Network',
      badge: '2 Bus Changes',
      badgeColor: 'bg-orange-100 text-orange-800',
      duration: '1 hr 40 min',
      changes: 2,
      price: '₹35',
      frequency: 'Every 15 mins',
      steps: [
        'Board PMPL Bus #305 from Talegaon Station to Nigdi Depot',
        'Transfer at Nigdi Depot to Bus #43 (Nigdi to Swargate)',
        'Arrive at Shivajinagar / Pune Station'
      ]
    },
    {
      id: 3,
      type: 'metro',
      title: 'PMPL Bus + Pune Metro',
      badge: 'Comfortable & Eco-Friendly',
      badgeColor: 'bg-purple-100 text-purple-800',
      duration: '1 hr 15 min',
      changes: 1,
      price: '₹40',
      frequency: 'Every 10 mins (Metro)',
      steps: [
        'Take PMPL Bus or Auto from Talegaon to PCMC Metro Station',
        'Board Purple Line Metro from PCMC Station to District Court / Civil Court',
        'Switch to Aqua Line or walk to Pune Station'
      ]
    },
    {
      id: 4,
      type: 'msrtc',
      title: 'MSRTC ST Bus',
      badge: 'Direct State Transport',
      badgeColor: 'bg-blue-100 text-blue-800',
      duration: '1 hr 20 min',
      changes: 0,
      price: '₹60',
      frequency: 'Every 20 mins',
      steps: [
        'Board MSRTC Shivneri / Ordinary Bus at Talegaon Highway Stop',
        'Direct ride via Old Pune-Mumbai Highway',
        'Drop off at Shivajinagar Bus Stand'
      ]
    }
  ];

  // Track user location
  const handleTrackLocation = () => {
    if (navigator.geolocation) {
      setTrackingStatus('Locating you...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setTrackingStatus(`Location Found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          setTrackingStatus('Unable to retrieve location. Please allow GPS access.');
        }
      );
    } else {
      setTrackingStatus('Geolocation is not supported by your browser.');
    }
  };

  const swapLocations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col justify-between">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
              🚆
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              TransitHub
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
            <a href="#home" className="hover:text-orange-500 transition-colors">Home</a>
            <a href="#search-section" className="hover:text-orange-500 transition-colors">Route Planner</a>
            <a href="#timetable" className="hover:text-orange-500 transition-colors">Timetables</a>
            <a href="#track-location" className="hover:text-orange-500 transition-colors">Live GPS Track</a>
            <a href="#about" className="hover:text-orange-500 transition-colors">About Us</a>
            <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
          </nav>

          {/* CTA Button */}
          <button 
            onClick={handleTrackLocation}
            className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <span>📍</span>
            <span>Live Location</span>
          </button>
        </div>
      </header>

      {/* HERO & SEARCH SECTION */}
      <section id="home" className="relative bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            All-In-One Pune Transit System
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-3 mb-4 leading-tight">
            Train, PMPL Bus, Metro & MSRTC <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Ekach Platform Var!
            </span>
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Ata pratek transit app vegla pahaychi garaj nahi. Check exact stops, live schedules, transfers, and optimal routes seamlessly.
          </p>
        </div>

        {/* SEARCH CARD CONTAINER */}
        <div id="search-section" className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
          
          {/* Toggle Directions / Lines */}
          <div className="bg-gray-100/80 p-1.5 flex justify-center space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('directions')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'directions'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              🧭 Find Directions & Routes
            </button>
            <button
              onClick={() => setActiveTab('lines')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'lines'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              🚉 Transit Lines & Timetables
            </button>
          </div>

          {/* Form Input */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative flex flex-col md:flex-row items-center gap-3">
                
                {/* Source Input */}
                <div className="w-full relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    From (Starting Point)
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-orange-500 focus-within:bg-white transition-all">
                    <span className="mr-2 text-xl">🟢</span>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="Enter start location..."
                      className="w-full bg-transparent outline-none text-gray-800 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={swapLocations}
                  className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md hover:scale-110 transition-all my-1 md:my-0"
                  title="Swap locations"
                >
                  🔄
                </button>

                {/* Destination Input */}
                <div className="w-full relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    To (Destination)
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-orange-500 focus-within:bg-white transition-all">
                    <span className="mr-2 text-xl">🔴</span>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination..."
                      className="w-full bg-transparent outline-none text-gray-800 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 text-lg transition-all transform hover:-translate-y-0.5"
              >
                🔍 Search Best Route Options
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SEARCH RESULTS SECTION */}
      {searched && (
        <section className="max-w-5xl mx-auto px-4 py-8 w-full animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Routes for <span className="text-orange-600">{source}</span> ➔ <span className="text-orange-600">{destination}</span>
              </h2>
              <p className="text-sm text-gray-500">Comparison across Train, PMPL Bus, Metro & MSRTC</p>
            </div>

            {/* Filter Mode Buttons */}
            <div className="flex flex-wrap gap-2">
              {['all', 'train', 'pmpl', 'metro', 'msrtc'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedMode === mode
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 gap-4">
            {routeOptions
              .filter((item) => selectedMode === 'all' || item.type === selectedMode)
              .map((option) => (
                <div
                  key={option.id}
                  className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">
                        {option.type === 'train' && '🚆'}
                        {option.type === 'pmpl' && '🚌'}
                        {option.type === 'metro' && '🚇'}
                        {option.type === 'msrtc' && '🚍'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{option.title}</h3>
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${option.badgeColor}`}>
                          {option.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-xs text-gray-400">Total Duration</div>
                        <div className="text-lg font-extrabold text-gray-800">{option.duration}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Changes / Bus Transfers</div>
                        <div className="text-lg font-extrabold text-orange-600">{option.changes} Transfers</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Est. Price</div>
                        <div className="text-lg font-extrabold text-green-600">{option.price}</div>
                      </div>
                    </div>
                  </div>

                  {/* Route Steps Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Step-by-Step Directions:</h4>
                    <ul className="space-y-2">
                      {option.steps.map((step, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mr-3">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* GPS LIVE LOCATION & NEAREST STATIONS */}
      <section id="track-location" className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-extrabold mb-2">📍 Live GPS Location & Nearby Stops</h2>
            <p className="text-orange-100 text-sm md:text-base max-w-xl">
              Understand how to get to your nearest Bus Stop, Metro Station, or Railway Station from your current location instantly.
            </p>
            {trackingStatus && (
              <div className="mt-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold inline-block">
                {trackingStatus}
              </div>
            )}
          </div>
          <button
            onClick={handleTrackLocation}
            className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-orange-50 transition-all transform hover:scale-105"
          >
            Track My Location Now
          </button>
        </div>
      </section>

      {/* TIMETABLE & SCHEDULE SECTION */}
      <section id="timetable" className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Transit Timetables & Schedules</h2>
          <p className="text-gray-500 text-sm mt-1">Select transit type to view daily schedule</p>
        </div>

        {/* Timetable Tabs */}
        <div className="flex justify-center space-x-3 mb-6">
          {[
            { id: 'train', label: '🚆 Local Trains' },
            { id: 'pmpl', label: '🚌 PMPL Buses' },
            { id: 'metro', label: '🚇 Pune Metro' },
            { id: 'msrtc', label: '🚍 MSRTC Buses' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTimetableMode(t.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedTimetableMode === t.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Timetable Table Display */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {selectedTimetableMode === 'train' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-500 text-white text-xs font-bold uppercase">
                    <th className="p-4">Train No / Name</th>
                    <th className="p-4">Departure (Talegaon)</th>
                    <th className="p-4">Arrival (Pune)</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium">
                  {trainData.map((t, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">
                        {t.number} - {t.name}
                      </td>
                      <td className="p-4 text-orange-600 font-semibold">{t.dep}</td>
                      <td className="p-4 text-gray-700">{t.arr}</td>
                      <td className="p-4 text-gray-500">{t.duration}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{t.runs}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-bold mb-2">Schedule updated in real-time!</p>
              <p className="text-sm">Frequency: Every 10 to 15 mins across major stops between Talegaon, Nigdi, Pimpri, Chinchwad & Pune City.</p>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="bg-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-800">About TransitHub</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            TransitHub aims to simplify public transport for commuter daily travel across Pune and suburban regions like Talegaon, Pimpri-Chinchwad, and Lonavala. By integrating Local Trains, PMPL Buses, Pune Metro, and MSRTC, TransitHub offers a single unified solution for routes, schedules, fares, and transfers.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🚆</span>
              <span className="text-2xl font-bold text-white">TransitHub</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Your ultimate Pune mobility platform for seamless commuting across Trains, Buses & Metro.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#search-section" className="hover:text-white transition-colors">Route Planner</a></li>
              <li><a href="#timetable" className="hover:text-white transition-colors">Schedules</a></li>
              <li><a href="#track-location" className="hover:text-white transition-colors">Track Location</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Transit Modes</h4>
            <ul className="space-y-2 text-xs">
              <li>🚆 Local Trains (CR)</li>
              <li>🚌 PMPL City Buses</li>
              <li>🚇 Pune Metro</li>
              <li>🚍 MSRTC State Transport</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Contact Us</h4>
            <p className="text-xs text-gray-400 mb-2">Talegaon Dabhade - Pune Transit Portal</p>
            <p className="text-xs text-gray-400">Email: support@transithub.in</p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} TransitHub. All rights reserved. Designed for smart public transport navigation.
        </div>
      </footer>

    </div>
  );
}