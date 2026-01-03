import React, { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation, Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  Search, 
  ArrowRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Share2,
  Clock,
  ChevronRight,
  Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { blogPosts, blogPostBySlug } from "@/features/blog/blogPosts";

// --- Components ---

const BlogHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="max-w-4xl mx-auto text-center mb-24">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.85] text-white"
    >
      The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 animate-gradient-x">Prism Journal</span>
    </motion.h1>
    <p className="text-xl text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
      {subtitle}
    </p>
  </div>
);

const PostCard = ({ post, featured = false }: { post: any; featured?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={cn(
      "group relative overflow-hidden rounded-[40px] border border-white/10 bg-[#0a0a0a] transition-all duration-500 hover:border-white/20 shadow-2xl",
      featured ? "md:col-span-3 flex flex-col md:flex-row" : "flex flex-col"
    )}
  >
    <div className={cn(
      "relative overflow-hidden",
      featured ? "md:w-3/5 aspect-video md:aspect-auto" : "aspect-[16/10]"
    )}>
      <img 
        src={post.meta.image} 
        alt={post.meta.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute top-6 left-6">
        <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
          {post.meta.category}
        </span>
      </div>
    </div>
    
    <div className={cn(
      "p-10 flex flex-col justify-between",
      featured ? "md:w-2/5" : "flex-1"
    )}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {post.meta.date}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><Clock size={12} /> 10 min read</span>
        </div>
        <h2 className={cn(
          "font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter leading-tight",
          featured ? "text-3xl md:text-5xl" : "text-2xl"
        )}>
          {post.meta.title}
        </h2>
        <p className="text-slate-400 font-medium line-clamp-3 leading-relaxed">
          {post.meta.excerpt}
        </p>
      </div>
      
      <div className="mt-10">
        <Link 
          to={post.meta.slug}
          className="inline-flex items-center gap-2 text-white font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
        >
          Read Article <ArrowRight size={18} className="text-indigo-500" />
        </Link>
      </div>
    </div>
  </motion.div>
);

const SinglePostView = ({ post }: { post: any }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-4xl mx-auto"
  >
    {/* Back button */}
    <Link 
      to="/blog" 
      className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 font-black uppercase tracking-widest text-xs"
    >
      <ArrowLeft size={16} /> Back to Journal
    </Link>

    {/* Post Content */}
    <article className="rounded-[48px] border border-white/5 bg-[#0a0a0a] overflow-hidden shadow-2xl pb-20">
      <div className="aspect-[21/9] w-full relative">
        <img 
          src={post.meta.image} 
          alt={post.meta.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="px-8 md:px-20 -mt-20 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <span className="px-4 py-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest">
            {post.meta.category}
          </span>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Calendar size={14} /> {post.meta.date}
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tighter leading-[0.9]">
          {post.meta.title}
        </h1>

        <div className="flex items-center justify-between border-y border-white/5 py-8 mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <User size={24} className="text-white/80" />
              </div>
            </div>
            <div>
              <div className="text-sm font-black text-white uppercase tracking-widest">{post.meta.author}</div>
              <div className="text-xs text-slate-500 font-medium">Chief Technology Officer</div>
            </div>
          </div>
          <button className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Share2 size={20} />
          </button>
        </div>

        <div className="help-markdown prose prose-invert prose-indigo max-w-none prose-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
    
    {/* Related CTA */}
    <div className="mt-20 p-12 rounded-[48px] bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 text-center">
      <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Ready to build the future?</h3>
      <p className="text-slate-400 mb-8 font-medium italic">Join Nan and the synthetic squad in redefining visual communication.</p>
      <Link to="/register">
        <button className="px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition-all shadow-xl">
          Get Started for Free
        </button>
      </Link>
    </div>
  </motion.div>
);

export default function BlogPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  
  const currentPost = useMemo(() => {
    if (!slug) return null;
    return blogPostBySlug.get(`/blog/${slug}`);
  }, [slug]);

  // Sync scroll on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="pt-32 pb-40">
        <Container>
          <AnimatePresence mode="wait">
            {currentPost ? (
              <SinglePostView key={slug} post={currentPost} />
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-24"
              >
                <BlogHeader 
                  title="The Prism Journal"
                  subtitle="Deep insights into visual networking, silicon-led engineering, and the 30-day miracle."
                />

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/10">
                  <div className="flex gap-4">
                    {["All", "Technical", "Industry", "Engineering"].map(cat => (
                      <button key={cat} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search insights..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium text-slate-300"
                    />
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {blogPosts.map((post, idx) => (
                    <PostCard 
                      key={post.filePath} 
                      post={post} 
                      featured={idx === 0} 
                    />
                  ))}
                </div>

                {/* Newsletter Box */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="p-12 md:p-24 rounded-[60px] bg-[#0d0d0d] border border-white/5 text-center relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Code2 size={160} className="text-indigo-500" />
                  </div>
                  <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                      Stay Ahead of the <span className="text-indigo-400 italic">Curve</span>
                    </h2>
                    <p className="text-lg text-slate-400 font-medium">
                      The future of visual networks is moving fast. Get our latest engineering breakthroughs delivered to your inbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-colors font-medium"
                      />
                      <button className="px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition-all shadow-xl">
                        Subscribe
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>

      <Footer />
    </div>
  );
}