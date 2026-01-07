import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Shield, Lock, Eye, Database, Share2, UserCheck, Smartphone, ChevronRight, Mail, Cookie, Globe, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const contentEn = `
## 1. Overview & Scope
This Privacy Policy describes how Prism Cloud Lite (provided by **NanProduced**) collects, uses, and discloses your information. We are committed to protecting your privacy and ensuring that your personal and IoT data is handled securely. This policy applies to all services provided via https://prism.nanproduced.cloud and associated display hardware.

## 2. Information We Collect
We collect information that you provide directly to us, information from your use of our Service, and technical data from your connected display hardware.

### 2.1 Personal & Identity Data (via Google OAuth)
**Account Data**: When you authenticate via Google, we collect your email address, full name, and profile picture URL. We use this data solely to create your account, manage your display network, and verify your identity.

**Support & Communications**: Records of support tickets or legal inquiries sent to our team.

### 2.2 IoT & Device Telemetry
**Hardware Identifiers**: Unique Device IDs, MAC addresses, and IP addresses of connected display terminals.  

**Operational Status**: Real-time heartbeat logs, CPU/Memory usage, and storage capacity.

**Diagnostic Assets**: On-demand remote screenshots and hardware logs captured strictly for troubleshooting purposes.

## 3. Cookie & Tracking Technology
We use cookies to ensure the basic functionality and security of the platform.

**Strictly Necessary Cookies**: Required for secure login sessions (HttpOnly), CSRF protection, and user preferences.

**Functional Analytics**: We use internal logs to analyze dashboard performance. We do not use cross-site tracking cookies for advertising or marketing purposes.

**Control**: You can manage cookie preferences through browser settings; however, disabling strictly necessary cookies will prevent successful login.

## 4. Email Communications (SMTP Services)
Prism Cloud Lite uses SMTP services (via Spring Boot Mail) to send essential transactional emails.        

**Types of Emails**: Security alerts (e.g., new device login), device status notifications (e.g., hardware offline), and password reset instructions.

**Legal Compliance**: In accordance with the CAN-SPAM Act and GDPR, all non-critical emails include a clear Unsubscribe link.

**Critical Alerts**: Account security and billing-related notifications cannot be opted out of, as they are necessary for the safe operation of your account.

## 5. AI Intelligence & Data Processing
When you interact with the Prism AI Assistant:

**Contextual Processing**: Interaction logs are processed via Retrieval-Augmented Generation (RAG) to provide workspace-specific assistance.

**Privacy Boundary**: We do not use your private media assets (videos/images) to train public LLM models.     

**Data Minimization**: Personally identifiable information (PII) is masked or stripped before logs are analyzed for global service improvements.

## 6. Data Sharing & Sub-processors
We do not sell your personal data. We share information only with trusted infrastructure providers necessary for service delivery:

- **Cloud Infrastructure**: AWS (Hong Kong Region) for compute and encrypted storage.
- **Identity Services**: Google OAuth 2.0 for secure authentication.
- **Visualization**: MapTiler for device geolocation mapping.
- **Communication**: Transactional email delivery via SMTP-compliant servers.

## 7. International Data Transfers
Your data is primarily stored in **AWS Hong Kong**. By using the Service, you acknowledge that your information may be transferred to and processed in servers outside your home country. We implement Standard Contractual Clauses (SCCs) to ensure a level of data protection equivalent to your home jurisdiction.

## 8. GDPR Compliance (EEA Users)
If you are located in the European Economic Area (EEA), you have the following rights:

**Right to Access/Rectify**: Request a copy of your stored data or correct errors.

**Right to Erasure**: Request the full deletion of your account and associated telemetry ("Right to be forgotten").

**Legal Basis**: We process data based on Contractual Necessity (to provide the requested service) and Legitimate Interest (security monitoring and service optimization).

## 9. CCPA/CPRA Compliance (California)
We do not sell or share personal information for cross-context behavioral advertising. In the past 12 months, we have collected Identifiers (Email, IP) and Geolocation data for business operational purposes only.

## 10. Children’s Privacy
Our Service is not directed to children under the age of 16. If we discover that a minor has provided us with personal information without parental consent, we will delete it immediately.

## 11. Data Retention & Deletion
**Account Data**: Retained as long as your account is active.

**Telemetry Logs**: Rotated and purged every 30–90 days.

**Full Deletion**: Users may request account termination via the dashboard. Upon termination, all personal data is deleted within 30 days, except where retention is required by law.

## 12. Contact & Grievance
For privacy-related inquiries or to exercise your data rights, please contact: **prismcloud@yeah.net**
`;

const contentZh = `
## 1. 概述与范围
本隐私政策描述了 Prism Cloud Lite（由 **NanProduced** 提供）如何收集、使用和披露您的信息。我们致力于保护您的隐私，并确保您的个人及物联网（IoT）数据得到安全处理。本政策适用于通过 https://prism.nanproduced.cloud 及相关显示硬件提供的所有服务。

## 2. 我们收集的信息
我们收集您直接提供给我们的信息、您使用我们服务时产生的信息，以及来自您连接的显示硬件的技术数据。

### 2.1 个人与身份数据 (通过 Google OAuth)
**账号数据**：当您通过 Google 进行身份验证时，我们会收集您的电子邮箱地址、全名和个人资料图片 URL。我们仅将这些数据用于创建您的账号、管理您的显示网络以及验证您的身份。

**支持与通讯**：发送给我们团队的支持工单或法律咨询记录。

### 2.2 物联网与设备遥测
**硬件标识符**：连接的显示终端的唯一设备 ID、MAC 地址和 IP 地址。

**运行状态**：实时心跳日志、CPU/内存占用率及存储容量。

**诊断资产**：严格为排障目的而按需捕获的远程截屏和硬件日志。

## 3. Cookie 与追踪技术
我们使用 Cookie 来确保平台的基础功能和安全性。

**必要型 Cookie**：用于安全登录会话 (HttpOnly)、CSRF 保护和用户偏好设置。

**功能性分析**：我们使用内部日志分析控制台性能。我们不会将跨站追踪 Cookie 用于广告或营销目的。

**控制方式**：您可以通过浏览器设置管理 Cookie 偏好；但是，禁用必要型 Cookie 将导致无法正常登录。

## 4. 邮件通讯 (SMTP 服务)
Prism Cloud Lite 使用 SMTP 服务（通过 Spring Boot Mail）发送必要的事务性邮件。

**邮件类型**：安全提醒（如新设备登录）、设备状态通知（如硬件离线）和密码重置指令。

**法律合规**：根据 CAN-SPAM 法案和 GDPR，所有非关键邮件均包含清晰的退订链接。

**关键告警**：账号安全和计费相关的通知无法退订，因为它们是账号安全运行所必需的。

## 5. AI 智能与数据处理
当您与 Prism AI 助手交互时：

**上下文处理**：交互日志通过检索增强生成 (RAG) 技术处理，以提供针对特定工作空间的协助。

**隐私边界**：我们不会使用您的私有媒体资产（视频/图片）来训练公共大语言模型。

**数据最小化**：在将日志用于全局服务改进分析之前，会对个人身份信息 (PII) 进行掩码或剥离处理。

## 6. 数据共享与子处理器
我们不会出售您的个人数据。我们仅与提供服务所必需的受信基础设施供应商共享信息：

- **云基础设施**：AWS（香港区域），用于计算和加密存储。
- **身份服务**：Google OAuth 2.0，用于安全认证。
- **可视化**：MapTiler，用于设备地理位置映射。
- **邮件通讯**：通过符合 SMTP 规范的服务器交付事务性邮件。

## 7. 跨境数据传输
您的数据主要存储在 **AWS 香港**。使用本服务即表示您知晓您的信息可能会被传输至您所在国家/地区以外的服务器进行处理。我们实施了标准合同条款 (SCCs) 以确保达到与您所在地司法管辖区同等的数据保护水平。

## 8. GDPR 合规性 (欧盟用户)
如果您位于欧洲经济区 (EEA)，您拥有以下权利：

**访问与更正权**：请求调阅您的存储数据副本或纠正错误。

**删除权**：请求彻底删除您的账号及相关的遥测数据（“被遗忘权”）。

**法律依据**：我们基于**合同必要性**（提供所请求的服务）和**正当利益**（安全监控和服务优化）处理数据。

## 9. CCPA/CPRA 合规性 (加利福尼亚州)
我们不会为了跨上下文行为广告而出售或共享个人信息。在过去的 12 个月中，我们仅出于业务运营目的收集了标识符（邮箱、IP）和地理位置数据。

## 10. 儿童隐私
我们的服务不面向 16 岁以下的儿童。如果我们发现未成年人在未经父母同意的情况下向我们提供了个人信息，我们将立即予以删除。

## 11. 数据保留与删除
**账号数据**：只要您的账号处于活跃状态就会一直保留。

**遥测日志**：每 30–90 天自动清除。

**彻底删除**：用户可以通过控制台请求注销账号。注销后，所有个人数据将在 30 天内删除，除非法律要求保留。

## 12. 联系与投诉
如有隐私相关咨询或行使数据权利，请联系：**prismcloud@yeah.net**
`;

export default function PrivacyPolicyPage() {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const [activeSection, setActiveSection] = useState("overview--scope");

  const sections = useMemo(() => [
    { id: "overview--scope", title: isZh ? "1. 概述与范围" : "1. Overview" },
    { id: "information-we-collect", title: isZh ? "2. 数据收集" : "2. Information" },
    { id: "cookie--tracking-technology", title: isZh ? "3. Cookie 技术" : "3. Cookies" },
    { id: "email-communications-smtp-services", title: isZh ? "4. 邮件通讯" : "4. Emails" },
    { id: "ai-intelligence--data-processing", title: isZh ? "5. AI 智能处理" : "5. AI Processing" },
    { id: "data-sharing--sub-processors", title: isZh ? "6. 子处理器共享" : "6. Sharing" },
    { id: "international-data-transfers", title: isZh ? "7. 跨境传输" : "7. Transfers" },
    { id: "gdpr-compliance-eea-users", title: isZh ? "8. GDPR 权利" : "8. GDPR" },
    { id: "ccpacpra-compliance-california", title: isZh ? "9. CCPA 合规" : "9. CCPA" },
    { id: "childrens-privacy", title: isZh ? "10. 儿童隐私" : "10. Children" },
    { id: "data-retention--deletion", title: isZh ? "11. 保留与删除" : "11. Retention" },
    { id: "contact--grievance", title: isZh ? "12. 联系方式" : "12. Contact" },
  ], [isZh]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="pt-40 pb-32">
        <Container>
          <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 relative">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-32 space-y-8">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">
                    {isZh ? "隐私章节" : "Privacy Sections"}
                  </p>
                  <nav className="flex flex-col">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollTo(section.id)}
                        className={cn(
                          "group flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                          activeSection === section.id 
                            ? "text-indigo-400 bg-indigo-400/5" 
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                        )}
                      >
                        <span className="truncate">{section.title}</span>
                        <ChevronRight 
                          size={14} 
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            activeSection === section.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                          )} 
                        />
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="px-4 pt-8 border-t border-white/5 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                       <Mail size={12} /> {isZh ? "数据保护官" : "DPO Contact"}
                    </h4>
                    <a href="mailto:prismcloud@yeah.net" className="text-[13px] text-slate-500 hover:text-indigo-400 transition-colors font-mono">
                      prismcloud@yeah.net
                    </a>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                      <Cookie size={14} />
                      <span className="text-[10px] font-black uppercase">Cookie Preference</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {isZh ? "此网站使用必要型 Cookie 以维持系统运行。" : "This site uses essential cookies for platform security."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1 max-w-3xl">
              <header className="mb-20">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Shield size={24} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500/80">{isZh ? "隐私与安全中心" : "Privacy & Safety Center"}</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8">{isZh ? "隐私政策" : "Privacy Policy"}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-slate-400 text-[13px] font-medium border-b border-white/10 pb-8">
                  <span className="flex items-center gap-2"><Globe size={14} className="text-slate-600" /><span className="text-slate-600 italic">{isZh ? "全球适用版本" : "Global Version"}</span></span>
                  <span className="hidden sm:block h-1 w-1 rounded-full bg-slate-700" />
                  <span className="flex items-center gap-2"><Clock size={14} className="text-slate-600" /><span className="text-slate-600 italic">{isZh ? "更新于" : "Updated on"}</span> Jan 01, 2026</span>
                </div>
              </header>
              <div className="prose prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-24 prose-h2:mb-8 prose-h2:pt-8 prose-h3:text-xl prose-h3:text-white prose-h3:mt-12 prose-h3:mb-4 prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6 prose-li:text-slate-400 prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2 prose-strong:text-white prose-strong:font-black prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                {sections.map((section, idx) => {
                  const rawContent = (isZh ? contentZh : contentEn);
                  const sectionContent = rawContent.split(/(?=## \d+\.)/)[idx + 1] || "";
                  return (
                    <section key={section.id} id={section.id} className="scroll-mt-32">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{sectionContent}</ReactMarkdown>
                    </section>
                  );
                })}
              </div>
              <footer className="mt-32 pt-16 border-t border-white/5">
                <div className="p-8 md:p-12 rounded-[32px] bg-indigo-500/[0.02] border border-white/5 relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-bold text-white">{isZh ? "数据主体请求" : "Data Subject Requests"}</h3>
                    <p className="text-slate-400 text-lg leading-relaxed">{isZh ? "如果您想行使 GDPR 或 CCPA 下的权利，如导出或删除您的数据，请发送邮件至我们的合规邮箱。" : "To exercise your rights under GDPR or CCPA, such as data export or deletion, please contact our compliance desk."}</p>
                    <a href="mailto:prismcloud@yeah.net" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-lg">prismcloud@yeah.net <ChevronRight size={18} /></a>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}