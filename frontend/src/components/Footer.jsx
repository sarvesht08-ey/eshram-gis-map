import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import TRAILogo from "../assets/trai.svg"; // Ensure this path is correct

const Footer = () => {
  const linkGroups = [
    {
      title: "About TRAI",
      links: [
        "Overview",
        "Leadership",
        "Organization",
        "Annual Reports",
        "RTI",
      ],
    },
    {
      title: "Consumers",
      links: [
        "File Complaint",
        "DND Registration",
        "MNP Portal",
        "Tariff Calculator",
        "Know Your Rights",
      ],
    },
    {
      title: "Industry",
      links: [
        "Licensing",
        "Regulations",
        "Consultations",
        "Reports",
        "Compliance",
      ],
    },
    {
      title: "Resources",
      links: ["Publications", "Press Releases", "Tenders", "Careers", "FAQs"],
    },
  ];

  return (
    <footer className="bg-[#0F1729] text-[#9ca3af] font-sans border-t border-gray-900/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 pb-6">
        {/* --- Top Section: Main Grid --- */}
        {/* Using a 12-column grid allows better spacing control for 13" vs 15" screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 xl:gap-12 mb-16">
          {/* Column 1: Brand & Contact (Spans 4 columns on large screens) */}
          <div className="lg:col-span-4 space-y-8 pr-0 lg:pr-8">
            {/* Logo Section */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={TRAILogo}
                  alt="TRAI Logo"
                  className="h-12 w-auto brightness-0 invert"
                />
                <div className="flex flex-col">
                  <h2 className="text-white font-bold text-xl tracking-wide leading-none mb-1">
                    TRAI
                  </h2>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                    Telecom Regulatory Authority of India
                  </p>
                </div>
              </div>
              <p className="text-[14px] leading-relaxed text-gray-400 max-w-sm">
                Ensuring fair competition, protecting consumer interests, and
                promoting orderly growth of India's telecom sector since 1997.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 text-[14px]">
              <div className="flex items-start gap-3 group">
                <Phone
                  size={18}
                  className="mt-0.5 text-gray-500 group-hover:text-blue-500 transition-colors shrink-0"
                />
                <span className="text-gray-300">1800-11-0420 (Toll Free)</span>
              </div>
              <div className="flex items-start gap-3 group">
                <Mail
                  size={18}
                  className="mt-0.5 text-gray-500 group-hover:text-blue-500 transition-colors shrink-0"
                />
                <a
                  href="mailto:cp@trai.gov.in"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  cp@trai.gov.in
                </a>
              </div>
              <div className="flex items-start gap-3 group">
                <MapPin
                  size={18}
                  className="mt-0.5 text-gray-500 group-hover:text-blue-500 transition-colors shrink-0"
                />
                <span className="text-gray-300 leading-snug">
                  Mahanagar Doorsanchar Bhawan, Jawahar Lal Nehru Marg, New
                  Delhi - 110002
                </span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3">
              {[Facebook, Twitter, Youtube, Linkedin].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-9 h-9 rounded-full bg-[#1F2937] hover:bg-[#2563EB] flex items-center justify-center text-gray-300 hover:text-white transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2-5: Link Lists (Each spans 2 columns) */}
          {/* This 2-col span ensures on 13inch screens (1024px) the columns aren't too narrow */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {linkGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="text-white font-semibold text-[15px] mb-6 tracking-wide">
                  {group.title}
                </h3>
                <ul className="space-y-3.5">
                  {group.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href="#"
                        className="text-[14px] text-gray-400 hover:text-white transition-colors duration-200 block"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* --- Divider --- */}
        <div className="border-t border-gray-800 mb-10"></div>

        {/* --- Newsletter Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12">
          <div className="w-full md:w-auto">
            <h3 className="text-white font-bold text-lg mb-1">Stay Updated</h3>
            <p className="text-sm text-gray-400">
              Subscribe to receive latest updates and notifications
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-0">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-[#151925] border border-gray-700 border-r-0 text-white px-4 py-3 rounded-l-md w-full md:w-72 lg:w-80 text-sm focus:outline-none focus:border-blue-600 transition-colors placeholder-gray-500"
            />
            <button className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-r-md text-sm transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>

        {/* --- Bottom Footer --- */}
      </div>
      <div className="flex bg-[#000000] px-52 pb-4 flex-col-reverse md:flex-row justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-900">
        {/* Bottom Left Links */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-300 transition-colors">
            Terms of Use
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            Accessibility
          </a>
          <a href="#" className="hover:text-gray-300 transition-colors">
            Sitemap
          </a>
        </div>

        {/* Bottom Right Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <span>© 2024 TRAI. All rights reserved.</span>
          <span className="hidden md:block text-gray-700">|</span>
          <a
            href="https://india.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            india.gov.in <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
