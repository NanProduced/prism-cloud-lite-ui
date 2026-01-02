import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const teamMembers = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO",
    image: "/assets/avatars/male/1.svg",
    bio: "Visionary leader with 10+ years in digital signage and IoT.",
    social: { twitter: "#", github: "#", linkedin: "#" }
  },
  {
    name: "Sarah Chen",
    role: "CTO",
    image: "/assets/avatars/female/2.svg",
    bio: "Ex-Google engineer specializing in cloud infrastructure and AI.",
    social: { twitter: "#", github: "#", linkedin: "#" }
  },
  {
    name: "Marcus Thorne",
    role: "Head of Design",
    image: "/assets/avatars/male/3.svg",
    bio: "Award-winning designer focused on minimal and intuitive interfaces.",
    social: { twitter: "#", github: "#", linkedin: "#" }
  },
  {
    name: "Elena Rossi",
    role: "Product Manager",
    image: "/assets/avatars/female/4.svg",
    bio: "Passionate about user experience and data-driven product growth.",
    social: { twitter: "#", github: "#", linkedin: "#" }
  }
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          
          <Container className="relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20"
              >
                Our Mission
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
              >
                Democratizing <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                  Visual Communication
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-400 leading-relaxed mb-12 max-w-2xl mx-auto"
              >
                We believe that every screen should tell a story. Prism Cloud Lite provides the tools to make digital signage accessible, intelligent, and beautiful for everyone.
              </motion.p>
            </div>
          </Container>
        </section>

        {/* Vision Section */}
        <section className="py-24 border-y border-white/5 bg-white/[0.01]">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold tracking-tight">Built for the future of display technology</h2>
                <p className="text-slate-400 leading-relaxed">
                  Founded in 2024, Prism Cloud started with a simple idea: why is digital signage software so complicated? We set out to build a platform that combines powerful enterprise-grade features with the ease of use of a modern web application.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div>
                    <div className="text-4xl font-bold text-indigo-400 mb-1">500+</div>
                    <div className="text-sm text-slate-500">Global Customers</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-purple-400 mb-1">2k+</div>
                    <div className="text-sm text-slate-500">Active Screens</div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="text-white/20 font-bold text-8xl select-none group-hover:scale-110 transition-transform duration-700">PRISM</div>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Team Section */}
        <section className="py-32">
          <Container>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">The Team behind the vision</h2>
              <p className="text-slate-400">A diverse group of makers, thinkers, and innovators.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 mb-6 grayscale hover:grayscale-0 transition-all duration-500">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-6">
                      <div className="flex gap-4">
                        <a href={member.social.twitter} className="text-white/80 hover:text-white"><Twitter size={18} /></a>
                        <a href={member.social.github} className="text-white/80 hover:text-white"><Github size={18} /></a>
                        <a href={member.social.linkedin} className="text-white/80 hover:text-white"><Linkedin size={18} /></a>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{member.name}</h3>
                  <p className="text-indigo-400 text-sm font-medium mb-2">{member.role}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Values */}
        <section className="py-24 bg-white/[0.02]">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">1</div>
                <h4 className="text-xl font-bold">Innovation First</h4>
                <p className="text-sm text-slate-500">We push the boundaries of what's possible in digital signage technology.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">2</div>
                <h4 className="text-xl font-bold">User Centric</h4>
                <p className="text-sm text-slate-500">Every feature we build starts with a real user need and ends with a smile.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">3</div>
                <h4 className="text-xl font-bold">Open Access</h4>
                <p className="text-sm text-slate-500">We believe in open standards and making technology accessible to all.</p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
