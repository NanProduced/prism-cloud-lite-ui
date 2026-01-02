import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Search, ArrowRight, Calendar, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const posts = [
  {
    title: "How AI is Transforming Digital Signage in 2026",
    excerpt: "Discover how generative AI and real-time data are changing the way brands interact with customers through physical displays.",
    author: "Alex Rivera",
    date: "Dec 15, 2025",
    category: "Industry",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "5 Best Practices for Choosing Signage Hardware",
    excerpt: "Not all screens are created equal. Learn what to look for when selecting hardware for your next deployment.",
    author: "Sarah Chen",
    date: "Nov 28, 2025",
    category: "Hardware",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Optimizing Your Content Workflow for Scale",
    excerpt: "From one screen to one thousand. Here's how to manage your content effectively as your display network grows.",
    author: "Marcus Thorne",
    date: "Nov 12, 2025",
    category: "Strategy",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Introducing Prism Cloud Lite V2.0",
    excerpt: "A deep dive into the new features and improvements in our latest major release.",
    author: "Elena Rossi",
    date: "Oct 30, 2025",
    category: "Product",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
              >
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Prism Journal</span>
              </motion.h1>
              <p className="text-lg text-slate-400">
                Insights, updates, and stories from the team building the future of visual communication.
              </p>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search articles..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Featured Post */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 mb-20 cursor-pointer"
          >
            <img 
              src={posts[0].image} 
              alt={posts[0].title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  Featured
                </span>
                <span className="text-slate-300 text-xs font-medium">10 min read</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">
                {posts[0].title}
              </h2>
              <p className="text-slate-300 text-sm md:text-base mb-8 line-clamp-2">
                {posts[0].excerpt}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <span className="text-sm font-bold">{posts[0].author}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-sm text-slate-400">{posts[0].date}</span>
              </div>
            </div>
          </motion.div>

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {posts.slice(1).map((post, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 mb-6">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                      {post.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-600" />
                    <span className="text-xs text-slate-500">{post.date}</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-700 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-40 p-12 rounded-[40px] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Never miss an update</h2>
              <p className="text-slate-400 mb-10 max-w-lg mx-auto">
                Join our newsletter and get the latest insights on digital signage and display technology delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                />
                <button className="w-full sm:w-auto px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-6">
                By subscribing, you agree to our Privacy Policy and consent to receive marketing emails.
              </p>
            </div>
            
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
