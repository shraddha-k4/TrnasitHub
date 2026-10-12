import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }
    setSubmitted(true);
  };

  const helplineContacts = [
    {
      title: "PMPML Passenger Helpline",
      number: "020-24503200 / 020-24545454",
      desc: "City buses, bus stops, passes & BRTS corridor inquiries",
      icon: "🚌",
      badge: "City Bus Service"
    },
    {
      title: "Indian Railways / Pune Local",
      number: "139 (Rail Madad)",
      desc: "Local EMU train schedules, station facilities & platform info",
      icon: "🚆",
      badge: "Central Railway"
    },
    {
      title: "Pune Metro Helpline",
      number: "1800-270-5501",
      desc: "Maha Metro Purple & Aqua Line ticketing, timings & smart card support",
      icon: "🚇",
      badge: "Maha Metro"
    },
    {
      title: "MSRTC State Transport Toll-Free",
      number: "1800-22-1250",
      desc: "ST bus reservations, Shivneri AC, Swargate & Shivajinagar depots",
      icon: "🚍",
      badge: "Maharashtra ST"
    }
  ];

  const faqs = [
    {
      q: "Where does TransitHub obtain timetable information?",
      a: "Our data is connected dynamically to backend schedule endpoints for PMPML, Central Railways, Maha Metro, and MSRTC bus schedules."
    },
    {
      q: "How can I track my live location on the transit map?",
      a: "Simply navigate to the 'Track My Live Location' page and permit browser location access. TransitHub will center the interactive map on your exact coordinates and highlight nearest transit stops."
    },
    {
      q: "Are the schedules updated for festivals and weekends?",
      a: "Yes! Timetables reflect standard operating days including weekday rush hour frequency and daily schedules."
    },
    {
      q: "Can I report a wrong timing or route discrepancy?",
      a: "Absolutely! Use the contact form below with the category 'Timetable Discrepancy' and our team will verify and update the backend dataset immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar />

      {/* HEADER SECTION */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <span>💬 Get in Touch</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Contact & Commuter Support
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about schedules, route connections, or feature requests? Contact our team or access official 24x7 Pune transit authority helplines.
          </p>
        </div>
      </section>

      {/* OFFICIAL HELPLINE CARDS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            Official Transit Helplines (Pune & PCMC)
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Direct emergency and inquiry numbers for commuters
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {helplineContacts.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm hover:border-orange-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full uppercase">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{item.desc}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                <span className="text-xs font-black text-orange-600 font-mono tracking-wide">
                  📞 {item.number}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT FORM & OFFICE INFO */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: CONTACT INFO CARD */}
          <div className="lg:col-span-5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-7 sm:p-9 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">
                Reach Us Directly
              </span>
              <h3 className="text-2xl font-black tracking-tight">TransitHub Helpdesk</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                We are committed to helping Pune commuters travel efficiently. Send us your feedback, bug reports, or partnership inquiries.
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs sm:text-sm">
              <div className="flex items-start space-x-3.5">
                <span className="text-xl">📧</span>
                <div>
                  <div className="font-bold text-white">Email Support</div>
                  <div className="text-gray-400">support@transithub.in</div>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="text-xl">📍</span>
                <div>
                  <div className="font-bold text-white">Location</div>
                  <div className="text-gray-400">Pune & Pimpri-Chinchwad, Maharashtra, India</div>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="text-xl">🕒</span>
                <div>
                  <div className="font-bold text-white">Digital Platform Availability</div>
                  <div className="text-gray-400">24 Hours / 7 Days a Week</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700/80 text-xs text-gray-400">
              <p>💡 Tip: For real-time bus timings and train tables, visit the Timetable section above.</p>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE FORM */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-9 border border-gray-200 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-gray-900">Message Received!</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Your message regarding "<strong>{formData.category}</strong>" has been submitted. Our team will review your feedback shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      category: "General Inquiry",
                      subject: "",
                      message: ""
                    });
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">Send Us a Message</h3>
                  <p className="text-xs text-gray-500">
                    Fill in the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-gray-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul@example.com"
                      className="w-full border border-gray-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Feedback Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white outline-none transition cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Timetable Discrepancy">Timetable Discrepancy</option>
                      <option value="Route Planner Help">Route Planner Help</option>
                      <option value="Live GPS Tracking Issue">Live GPS Tracking Issue</option>
                      <option value="Feature Suggestion">Feature Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Pune to Talegaon Train timing"
                      className="w-full border border-gray-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about your query or observation..."
                    className="w-full border border-gray-300 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white outline-none transition resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-orange-500/20 transition cursor-pointer text-sm"
                >
                  🚀 Submit Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Common questions answered for Pune transit travelers
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm"
            >
              <h4 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center space-x-2">
                <span className="text-orange-500 font-black">Q.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 pl-5 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
