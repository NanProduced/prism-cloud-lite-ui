import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export const BlogSection = () => {
  const { t } = useTranslation();

  const postsData = t("blog.posts", { returnObjects: true });
  
  const blogs = useMemo(() => {
    const icons = [
      <Globe size={24} className="text-blue-400" />,
      <Sparkles size={24} className="text-indigo-400" />,
      <Zap size={24} className="text-purple-400" />
    ];

    if (Array.isArray(postsData)) {
      return postsData.map((post: any, i: number) => ({
        ...post,
        icon: icons[i % icons.length]
      }));
    }
    return [];
  }, [postsData]);

  return (
    <section className="py-32 relative bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl text-white mb-6 font-bold tracking-tight">
              {t("blog.title")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-white to-purple-500">   
                {t("blog.titleHighlight")}
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {t("blog.description")}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {blogs.map((blog, i) => (
            <FadeIn
              key={i}
              delay={i * 0.1}
              className="group"
            >
              <Link to={blog.slug || "/blog"} className="block h-full">
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2rem] p-8 h-full hover:border-white/20 transition-all flex flex-col group/card">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-8 group-hover/card:scale-110 transition-transform">
                    {blog.icon}
                  </div>
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{blog.tag}</span>
                  </div>
                  <h3 className="text-2xl text-white font-bold mb-4 leading-tight group-hover/card:text-indigo-400 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {blog.desc}
                  </p>
                  <div className="mt-auto flex items-center text-white/50 group-hover/card:text-white font-bold text-xs uppercase tracking-widest transition-colors">
                    {t("blog.readMore")}{" "}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/card:translate-x-2 transition-transform" />    
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};