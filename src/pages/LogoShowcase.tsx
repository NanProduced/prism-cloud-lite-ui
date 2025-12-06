import { PrismIcon, PrismWordmark, PrismLogo } from '@/components/shared/logo';

const ShowcaseSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-20">
    <h2 className="text-3xl font-bold text-white mb-8">{title}</h2>
    {children}
  </section>
);

const ShowcaseCard = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all">
    {children}
    {label && (
      <div className="absolute bottom-4 left-4 text-sm text-slate-400 font-mono">
        {label}
      </div>
    )}
  </div>
);

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 测试环境标注 */}
      <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          测试环境 - 开发完成后删除
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-purple-950/30" />
        <div className="relative z-10 container mx-auto px-6 py-32 text-center">
          <PrismLogo size="2xl" className="justify-center mb-8" />
          <h1 className="text-5xl font-bold text-white mb-4">
            Prism Cloud Lite Logo System
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            完整的品牌标识系统，支持多种尺寸、变体和使用场景
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 text-sm">
            ⚠️ 此页面仅供开发测试参考，生产环境前将被删除
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">

        {/* Icon Variants */}
        <ShowcaseSection title="图标变体">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ShowcaseCard label="solid">
              <div className="flex items-center justify-center h-40">
                <PrismIcon size={80} variant="solid" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="gradient">
              <div className="flex items-center justify-center h-40">
                <PrismIcon size={80} variant="gradient" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="outline">
              <div className="flex items-center justify-center h-40">
                <PrismIcon size={80} variant="outline" />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Size Variations */}
        <ShowcaseSection title="尺寸变体">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <ShowcaseCard label="xs">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="xs" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="sm">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="sm" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="md">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="md" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="lg">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="lg" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="xl">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="xl" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="2xl">
              <div className="flex items-center justify-center h-32">
                <PrismLogo size="2xl" />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Layout Options */}
        <ShowcaseSection title="布局选项">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ShowcaseCard label="horizontal">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" variant="horizontal" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="vertical">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" variant="vertical" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="icon only">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" iconOnly />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Full Name */}
        <ShowcaseSection title="完整平台名称">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShowcaseCard label="horizontal + full name">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" showFullName />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="vertical + full name">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" variant="vertical" showFullName />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Icon Variants with Logo */}
        <ShowcaseSection title="图标变体组合">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ShowcaseCard label="solid + wordmark">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" iconVariant="solid" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="gradient + wordmark">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" iconVariant="gradient" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="outline + wordmark">
              <div className="flex items-center justify-center h-40">
                <PrismLogo size="lg" iconVariant="outline" />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Use Cases */}
        <ShowcaseSection title="使用场景">

          {/* Navigation Bar */}
          <div className="mb-8">
            <h3 className="text-xl text-white mb-4 font-semibold">导航栏</h3>
            <ShowcaseCard>
              <div className="flex items-center justify-between p-4">
                <PrismLogo size="sm" />
                <div className="flex gap-6 text-white">
                  <a href="#" className="hover:text-indigo-400">产品</a>
                  <a href="#" className="hover:text-indigo-400">方案</a>
                  <a href="#" className="hover:text-indigo-400">价格</a>
                  <a href="#" className="hover:text-indigo-400">关于</a>
                </div>
              </div>
            </ShowcaseCard>
          </div>

          {/* Hero Section */}
          <div className="mb-8">
            <h3 className="text-xl text-white mb-4 font-semibold">Hero 区域</h3>
            <ShowcaseCard>
              <div className="text-center py-16">
                <PrismLogo size="xl" className="justify-center mb-6" showFullName />
                <p className="text-2xl text-slate-300">新一代智能信息发布云平台</p>
              </div>
            </ShowcaseCard>
          </div>

          {/* Card */}
          <div className="mb-8">
            <h3 className="text-xl text-white mb-4 font-semibold">卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ShowcaseCard>
                <div className="p-4">
                  <PrismLogo size="md" className="mb-4" />
                  <h4 className="text-lg text-white font-semibold mb-2">企业级信息发布</h4>
                  <p className="text-slate-400">多终端统一管理，实时内容同步</p>
                </div>
              </ShowcaseCard>
              <ShowcaseCard>
                <div className="p-4">
                  <PrismIcon size={48} variant="gradient" className="mb-4" />
                  <h4 className="text-lg text-white font-semibold mb-2">云端管理</h4>
                  <p className="text-slate-400">随时随地访问和管理您的内容</p>
                </div>
              </ShowcaseCard>
            </div>
          </div>

          {/* Footer */}
          <div>
            <h3 className="text-xl text-white mb-4 font-semibold">页脚</h3>
            <ShowcaseCard>
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <PrismLogo size="md" className="mb-4" showFullName />
                    <p className="text-slate-400 max-w-sm">
                      新一代智能信息发布云平台
                      <br />让您的内容触达每一个屏幕
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-12 text-sm">
                    <div>
                      <h5 className="text-white font-semibold mb-3">产品</h5>
                      <ul className="space-y-2 text-slate-400">
                        <li><a href="#" className="hover:text-white">功能</a></li>
                        <li><a href="#" className="hover:text-white">场景</a></li>
                        <li><a href="#" className="hover:text-white">价格</a></li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-white font-semibold mb-3">公司</h5>
                      <ul className="space-y-2 text-slate-400">
                        <li><a href="#" className="hover:text-white">关于</a></li>
                        <li><a href="#" className="hover:text-white">博客</a></li>
                        <li><a href="#" className="hover:text-white">联系</a></li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-white font-semibold mb-3">支持</h5>
                      <ul className="space-y-2 text-slate-400">
                        <li><a href="#" className="hover:text-white">文档</a></li>
                        <li><a href="#" className="hover:text-white">API</a></li>
                        <li><a href="#" className="hover:text-white">帮助</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 text-sm text-slate-500 text-center">
                  © 2024 Prism Cloud Lite. All rights reserved.
                </div>
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

        {/* Color on Different Backgrounds */}
        <ShowcaseSection title="不同背景">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ShowcaseCard label="dark background">
              <div className="flex items-center justify-center h-40 bg-slate-900 rounded-lg">
                <PrismLogo size="lg" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="light background">
              <div className="flex items-center justify-center h-40 bg-slate-100 rounded-lg">
                <PrismLogo size="lg" color="#1e293b" />
              </div>
            </ShowcaseCard>
            <ShowcaseCard label="gradient background">
              <div className="flex items-center justify-center h-40 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <PrismLogo size="lg" iconVariant="outline" />
              </div>
            </ShowcaseCard>
          </div>
        </ShowcaseSection>

      </div>
    </div>
  );
}
