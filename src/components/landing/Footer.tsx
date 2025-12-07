
export const Footer = () => {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#050505] pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-6">
              <h4 className="text-2xl text-[#dddddd] font-medium mb-2">
                Subscribe to Newsletter
              </h4>
              <p className="text-[#8a8a8a] text-sm max-w-xs">
                Get monthly insights from cloud experts. No spam - promise.
              </p>
            </div>
            <div className="relative max-w-xs">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-[#5552ff]"
              />
              <button className="absolute right-1.5 top-1.5 bg-[#5552ff] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#4542cc] transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">Company</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Benefits</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">Product</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">Resources</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              P
            </div>
            <span className="text-white font-bold text-lg">Prism Cloud</span>
          </div>

          <p className="text-[#8a8a8a] text-sm">
            © {new Date().getFullYear()} Prism Cloud. All rights reserved
          </p>

          <div className="flex items-center gap-4 text-[#8a8a8a] text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="w-1 h-1 bg-[#666] rounded-full"></span>
            <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
