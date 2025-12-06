import React from 'react';
import {
  imgVector168,
  imgMetricContainer,
  imgVector209,
  imgDropdownIcon,
  imgVector,
  imgVector1,
  imgVector210,
  imgVector2
} from '@/assets/svg-hero';

const imgImage = "/.doc/landing_background_image.png";
const imgComponent1 = "/.doc/components/ede5e5d7c75fff13f0189b34d8e1d489a033a7ae.png";
const imgComponent2 = "/.doc/components/e21af0a8ae412ad37d638f82de0de3564c08ec85.png";
const imgComponent3 = "/.doc/components/a0e8b2848fe2181c7a002bfa0ca7ba663e568021.png";

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#0c0022]">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img
            alt=""
            className="absolute w-full h-full object-cover"
            style={{ objectPosition: '50% 50%' }}
            src={imgImage}
          />
          <div className="absolute bg-gradient-to-b from-[#0c0022] inset-0 to-transparent via-[rgba(18,7,59,0.5)]" />
        </div>
      </div>

      {/* Decorative Ellipses */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-20%] bottom-[-15%] w-[140%] h-[400px] opacity-40">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600/30 to-transparent blur-3xl" />
        </div>
        <div className="absolute left-[-10%] bottom-[-20%] w-[120%] h-[420px] opacity-30">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600/20 to-transparent blur-3xl" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full">

        {/* Header Navigation - Full Width */}
        <header className="w-full px-8 lg:px-24 py-8">
          <div className="flex items-center justify-between">
            {/* Left Navigation */}
            <nav className="flex items-center gap-8 text-white">
              <a href="#home" className="text-lg hover:text-purple-400 transition-colors">
                Home
              </a>
              <a href="#service" className="text-lg hover:text-purple-400 transition-colors">
                Service
              </a>
              <div className="flex items-center gap-3 cursor-pointer hover:text-purple-400 transition-colors">
                <span className="text-lg">Feature</span>
                <div className="w-3 h-2">
                  {imgDropdownIcon}
                </div>
              </div>
              <a href="#contact" className="text-lg hover:text-purple-400 transition-colors">
                Contact
              </a>
            </nav>

            {/* Center Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl font-bold text-white tracking-wider">NEXVISI</h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
              {/* Language Selector */}
              <div className="flex items-center gap-3 px-4 py-2 bg-[rgba(115,0,255,0.28)] border border-[#7300ff] rounded-full cursor-pointer hover:bg-[rgba(115,0,255,0.4)] transition-colors">
                <span className="text-sm text-white tracking-wider">EN</span>
                <div className="w-3 h-2">
                  {imgVector}
                </div>
              </div>

              {/* Contact Button */}
              <button className="flex items-center gap-4 px-6 py-3 bg-[#7300ff] rounded-full hover:bg-[#8b1aff] transition-colors">
                <span className="text-lg font-semibold text-white">Contact US</span>
                <div className="w-5 h-5">
                  {imgVector1}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section - Full Width with Left/Right Alignment */}
        <div className="w-full px-8 lg:px-24 py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-16">

            {/* Left Column - Main Content (Left-aligned) */}
            <div className="flex-1 space-y-6 max-w-2xl">

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="px-5 py-2 border border-[#7300ff] rounded-full bg-[rgba(115,0,255,0.1)]">
                  <span className="text-sm text-white">Insight Beyond</span>
                </div>
                <div className="px-5 py-2 border border-[#7300ff] rounded-full bg-[rgba(115,0,255,0.1)]">
                  <span className="text-sm text-white">Intelligence</span>
                </div>
                <div className="px-5 py-2 border border-[#7300ff] rounded-full bg-[rgba(115,0,255,0.1)] transform rotate-[8deg]">
                  <span className="text-sm text-white">Secure AI</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-normal text-white leading-tight">
                Innovate<br/>Without Limits
              </h1>

              {/* CTA Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Get Started Button */}
                <div className="px-2 py-2 bg-[rgba(115,0,255,0.28)] border border-[#7300ff] rounded-full">
                  <button className="flex items-center gap-3 px-5 py-2.5 bg-[#7300ff] rounded-full hover:bg-[#8b1aff] transition-colors">
                    <span className="text-base font-semibold text-white">Get Started</span>
                    <div className="w-3 h-3">
                      {imgVector168}
                    </div>
                  </button>
                </div>

                {/* Play Button */}
                <button className="w-14 h-14 flex items-center justify-center rounded-full bg-[rgba(115,0,255,0.28)] border border-[#7300ff] hover:bg-[rgba(115,0,255,0.4)] transition-colors">
                  <div className="w-10 h-10">
                    {imgMetricContainer}
                  </div>
                </button>

                {/* Statistics */}
                <div className="flex items-center gap-6 ml-4">
                  <div className="flex flex-col">
                    <p className="text-2xl lg:text-3xl font-medium text-white">
                      320M<span>+</span>
                    </p>
                    <p className="text-xs text-white/80 mt-1">Business</p>
                  </div>

                  <div className="w-px h-10 bg-white/30" />

                  <div className="flex flex-col">
                    <p className="text-2xl lg:text-3xl font-medium text-white">
                      590K<span>+</span>
                    </p>
                    <p className="text-xs text-white/80 mt-1">Happy Client</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Metric Card (Right-aligned) */}
            <div className="w-full lg:w-auto space-y-6">

              {/* Profit Metric Card */}
              <div className="bg-[rgba(115,0,255,0.13)] border border-[rgba(115,0,255,0.3)] rounded-[24px] p-5 w-full lg:w-[240px]">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs text-white/80">Profit</p>
                  <p className="text-2xl font-normal text-white">68.5%</p>
                </div>

                {/* Metric Bars */}
                <div className="flex items-end gap-1 h-[60px]">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar, index) => (
                    <div
                      key={bar}
                      className={`flex-1 rounded-lg transition-all ${
                        index === 5
                          ? 'bg-[rgba(115,0,255,0.28)]'
                          : 'bg-gradient-to-b from-[rgba(115,0,255,0)] to-[rgba(115,0,255,0.64)]'
                      }`}
                      style={{ height: index === 4 || index === 6 ? '85%' : '100%' }}
                    />
                  ))}
                </div>

                {/* Chart Line Overlay */}
                <div className="relative -mt-12 pointer-events-none">
                  <div className="w-full h-12 opacity-60">
                    {imgVector209}
                  </div>
                </div>
              </div>

              {/* Brand Identity Section */}
              <div className="space-y-3">
                <p className="text-base text-white uppercase leading-tight">
                  brand's digital<br/>identity
                </p>
                <button className="flex items-center gap-3 text-white hover:text-purple-400 transition-colors group">
                  <span className="text-sm font-semibold">Explore more</span>
                  <div className="transform rotate-180 group-hover:translate-x-1 transition-transform">
                    <div className="w-3 h-3">
                      {imgVector2}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Cards Section */}
        <div className="w-full px-8 lg:px-24 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Card 1: Custom AI Development */}
            <div className="relative rounded-[20px] border border-[#7300ff] overflow-hidden group">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={imgComponent1}
                  alt="Custom AI Development"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/80" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col h-[388px]">
                {/* Icon */}
                <div className="w-14 h-14 mb-6 bg-[#7300ff] rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-normal text-white mb-4 leading-tight">
                  Custom AI<br/>Development
                </h3>

                <div className="flex-1" />

                {/* Tags */}
                <div className="flex gap-2 mb-6">
                  <span className="px-4 py-1 border border-white rounded-full text-sm text-white">
                    Automation
                  </span>
                  <span className="px-4 py-1 border border-white rounded-full text-sm text-white">
                    API Access
                  </span>
                </div>

                {/* Button */}
                <div className="px-3 py-2 bg-[rgba(115,0,255,0.28)] border border-white rounded-full self-start">
                  <button className="flex items-center gap-3 px-5 py-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                    <span className="text-base font-semibold text-[#7300ff]">Get Started</span>
                    <div className="w-3 h-3">
                      {imgVector168}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Continuous AI Optimization (Taller Card) */}
            <div className="relative rounded-[20px] overflow-hidden group lg:row-span-1">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={imgComponent2}
                  alt="Continuous AI Optimization"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(63,50,228,0)] via-[rgba(18,7,59,0.5)] to-[#0c0022]" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-end h-[508px]">
                {/* Icon Button */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-[rgba(115,0,255,0.28)] border border-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-normal text-white text-center leading-tight">
                  Continuous AI<br/>Optimization
                </h3>
              </div>
            </div>

            {/* Card 3: AI-Driven R&D Acceleration */}
            <div className="relative rounded-[20px] border border-[#7300ff] overflow-hidden group">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={imgComponent3}
                  alt="AI-Driven R&D"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/80" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col h-[393px]">
                {/* Icon */}
                <div className="w-12 h-12 mb-auto ml-auto bg-[rgba(115,0,255,0.28)] border border-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                </div>

                {/* Percentage */}
                <p className="text-5xl font-light text-white mb-2">99.7%</p>
                <p className="text-base text-white mb-6">Cloud storage free</p>

                {/* Chart Visualization */}
                <div className="mb-6 h-16 relative">
                  <div className="absolute inset-0 flex items-end gap-1">
                    {[60, 70, 50, 80, 90, 85, 95].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  {/* Data points */}
                  <div className="absolute inset-0 flex items-center justify-around">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="w-2 h-2 bg-purple-300 rounded-full" />
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-center">
                  <p className="text-base text-white">Data backup</p>
                  <p className="text-base font-semibold text-white">75.6 GB</p>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-normal text-white text-center mt-6 leading-tight">
                  AI-Driven R&D<br/>Acceleration
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
