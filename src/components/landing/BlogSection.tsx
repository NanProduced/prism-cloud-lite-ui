import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

// Import images
import imgRectangle34625306 from "@/assets/figma/702a89769c4ccc7c677c2d8ff106b5636a66308c.png";
import imgRectangle34625307 from "@/assets/figma/c211f633a31d3f2b71aec55db858a5682912bb8c.png";
import imgRectangle34625308 from "@/assets/figma/5835ddaa07464bb0d40cc3509e4f7eb1e7323d5c.png";

export const BlogSection = () => {
  const blogs = [
    {
      title: "Real-Time Monitoring",
      desc: "Optimize your infrastructure through continuous monitoring. Track metrics to determine the most effective scaling strategies.",
      img: imgRectangle34625306,
    },
    {
      title: "Cloud Cost Optimization",
      desc: "Understanding the importance of cost management and how to implement efficient resource allocation methods.",
      img: imgRectangle34625307,
    },
    {
      title: "Future of Cloud",
      desc: "Predicting the next big trends in cloud infrastructure and how to stay ahead of the curve with modern tools.",
      img: imgRectangle34625308,
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-white mb-4 font-medium">
            Stay Updated with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5653ff] to-[#d252ff]">
              Latest in Cloud
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((blog, i) => (
            <FadeIn
              key={i}
              delay={i * 0.1}
              className="group cursor-pointer"
            >
              <div className="bg-[#0a0a0a]/70 border border-[#2a2a2a] rounded-2xl overflow-hidden p-6 h-full hover:border-[#5552ff]/50 transition-colors">
                <div className="rounded-xl overflow-hidden mb-6 h-48 relative">
                  <img
                    src={blog.img}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-2xl text-white font-medium mb-3 group-hover:text-[#5552ff] transition-colors">
                  {blog.title}
                </h3>
                <p className="text-[#aaaaaa] text-sm leading-relaxed mb-6">
                  {blog.desc}
                </p>
                <div className="flex items-center text-white font-medium text-sm mt-auto">
                  Read More{" "}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
