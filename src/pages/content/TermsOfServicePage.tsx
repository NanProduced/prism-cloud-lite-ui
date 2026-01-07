import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Scale, Clock, ShieldCheck, ChevronRight, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const contentEn = `
## 1. Acceptance of Terms
These terms and conditions apply to the Prism Cloud Lite app (hereby referred to as "Application") for devices that was created by **NanProduced** (hereby referred to as "Service Provider") as a Free service. Upon downloading or utilizing the Application, you are automatically agreeing to the following terms. It is strongly advised that you thoroughly read and understand these terms prior to using the Application.

## 2. Intellectual Property & Use Restrictions
Unauthorized copying, modification of the Application, any part of the Application, or our trademarks is strictly prohibited. Any attempts to extract the source code of the Application, translate the Application into other languages, or create derivative versions are not permitted. All trademarks, copyrights, database rights, and other intellectual property rights related to the Application remain the property of the Service Provider.

## 3. Service Changes & Charges
The Service Provider is dedicated to ensuring that the Application is as beneficial and efficient as possible. As such, they reserve the right to modify the Application or charge for their services at any time and for any reason. Any charges for the Application or its services will be clearly communicated to you.

## 4. Personal Data & Security
The Application stores and processes personal data that you have provided to the Service Provider in order to provide the Service. It is your responsibility to maintain the security of your device and access to the Application. The Service Provider strongly advises against jailbreaking or rooting your phone/device, as it may expose your device to malware/viruses and cause the Application to malfunction.

## 5. Connectivity & Third-Party Charges
Certain functions of the Application require an active internet connection (Wi-Fi or mobile network). The Service Provider cannot be held responsible if the Application does not function at full capacity due to lack of access to Wi-Fi or exhausted data allowance. You accept responsibility for any charges from your mobile provider, including roaming data charges if applicable.

## 6. Liability Disclaimer
While the Service Provider strives to ensure that the Application is updated and accurate at all times, they rely on third parties to provide information. The Service Provider accepts no liability for any loss, direct or indirect, that you experience as a result of relying entirely on this functionality of the application. You are responsible for ensuring your device remains charged and connected.

## 7. AI Technologies
The Application incorporates Artificial Intelligence (AI) technologies to provide certain features. By using the Application, you acknowledge and agree that AI may be used to process data and deliver functionalities. All AI usage complies with applicable laws and is designed to benefit the user experience.

## 8. Updates & Termination
The Service Provider may wish to update the application at some point. You agree to always accept updates when offered. The Service Provider may also cease providing the application and may terminate its use at any time without providing termination notice. Upon termination, (a) the rights and licenses granted to you in these terms will end; (b) you must cease using the application.

## 9. Changes to Terms
The Service Provider may periodically update these Terms and Conditions. You are advised to review this page regularly for any changes. These terms are effective as of **2026-01-01**.

## 10. Contact Us
If you have any questions or suggestions about the Terms and Conditions, please contact the Service Provider at: **prismcloud@yeah.net**
`;

const contentZh = `
## 1. 条款接受
本服务条款适用于由 **NanProduced**（以下简称“服务提供商”）作为免费服务创建的 Prism Cloud Lite 应用程序（以下简称“本应用”）。下载或使用本应用即表示您自动同意以下条款。强烈建议您在使用本应用前仔细阅读并理解这些条款。

## 2. 知识产权与使用限制
严禁未经授权复制、修改本应用及其任何部分或我们的商标。严禁任何尝试提取本应用源代码、将其翻译成其他语言或创建衍生版本的行为。与本应用相关的所有商标、版权、数据库权利及其他知识产权均归服务提供商所有。

## 3. 服务变更与收费
服务提供商致力于确保本应用尽可能有用且高效。因此，服务提供商保留随时以任何理由修改本应用或对服务收费的权利。本应用或其服务的任何费用都将向您明确说明。

## 4. 个人数据与安全
本应用存储并处理您提供给服务提供商的个人数据，以提供相关服务。您有责任维护设备的安全以及对应用的访问权限。服务提供商强烈建议不要对您的手机/设备进行越狱或获取根权限（root），因为这可能会使您的设备面临恶意软件/病毒的风险，并导致应用无法正常运行。

## 5. 网络连接与第三方费用
本应用的某些功能需要活跃的互联网连接（Wi-Fi 或移动网络）。如果因无法访问 Wi-Fi 或数据流量耗尽而导致应用无法充分发挥功能，服务提供商不承担责任。您需承担移动运营商收取的任何费用，包括（如果适用）漫游数据费用。

## 6. 免责声明
虽然服务提供商努力确保应用始终保持更新且准确，但我们确实依赖第三方提供信息。对于因完全依赖本应用功能而遭受的任何直接或间接损失，服务提供商不承担任何责任。您有责任确保您的设备保持充足电量并处于连接状态。

## 7. 人工智能技术 (AI)
本应用整合了人工智能技术以提供特定功能。使用本应用即表示您知晓并同意 AI 可能会被用于处理数据并交付功能。所有 AI 的使用均符合适用法律，并旨在优化用户体验。

## 8. 更新与终止
服务提供商可能会不时更新应用。您同意在获得更新推送时始终接受更新。服务提供商也可能停止提供应用，并可随时终止其使用而无需发出终止通知。一旦终止：(a) 授予您的权利和许可将终止；(b) 您必须停止使用该应用。

## 9. 条款变更
服务提供商可能会定期更新这些条款和条件。建议您定期查看此页面。这些条款自 **2026-01-01** 起生效。

## 10. 联系我们
如果您对条款和条件有任何疑问或建议，请联系服务提供商：**prismcloud@yeah.net**
`;

export default function TermsOfServicePage() {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const [activeSection, setActiveSection] = useState("acceptance-of-terms");

  const sections = useMemo(() => [
    { id: "acceptance-of-terms", title: isZh ? "1. 条款接受" : "1. Acceptance" },
    { id: "intellectual-property--use-restrictions", title: isZh ? "2. 知识产权" : "2. IP Rights" },
    { id: "service-changes--charges", title: isZh ? "3. 服务变更" : "3. Changes" },
    { id: "personal-data--security", title: isZh ? "4. 数据安全" : "4. Security" },
    { id: "connectivity--third-party-charges", title: isZh ? "5. 网络连接" : "5. Connectivity" },
    { id: "liability-disclaimer", title: isZh ? "6. 免责声明" : "6. Liability" },
    { id: "ai-technologies", title: isZh ? "7. AI 技术" : "7. AI Tech" },
    { id: "updates--termination", title: isZh ? "8. 更新终止" : "8. Termination" },
    { id: "changes-to-terms", title: isZh ? "9. 条款变更" : "9. Changes" },
    { id: "contact-us", title: isZh ? "10. 联系我们" : "10. Contact" },
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
    <div className="min-h-screen bg-black text-slate-50 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar />
      <main className="pt-40 pb-32">
        <Container>
          <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 relative">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-32 space-y-8">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">
                    {isZh ? "条款目录" : "Terms Menu"}
                  </p>
                  <nav className="flex flex-col">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollTo(section.id)}
                        className={cn(
                          "group flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                          activeSection === section.id 
                            ? "text-purple-400 bg-purple-400/5" 
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
                <div className="px-4 pt-8 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 mb-3">{isZh ? "法律咨询" : "Legal Inquiries"}</h4>
                  <a href="mailto:prismcloud@yeah.net" className="text-[13px] text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-2 font-mono">
                    prismcloud@yeah.net
                  </a>
                </div>
              </div>
            </aside>
            <div className="flex-1 max-w-3xl">
              <header className="mb-20">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Gavel size={24} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-500/80">{isZh ? "服务协议" : "Service Agreement"}</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8">Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Service</span></h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-slate-400 text-[13px] font-medium border-b border-white/10 pb-8">
                  <span className="flex items-center gap-2"><Clock size={16} /> {isZh ? "最后更新：2026年1月1日" : "Last updated: Jan 01, 2026"}</span>
                  <span className="hidden sm:block h-1 w-1 rounded-full bg-slate-700" />
                  <span className="flex items-center gap-2 text-emerald-400/80"><ShieldCheck size={16} /> {isZh ? "合规审查通过" : "Compliance Verified"}</span>
                </div>
              </header>
              <div className="prose prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-24 prose-h2:mb-8 prose-h2:pt-8 prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6 prose-li:text-slate-400 prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2 prose-strong:text-white prose-strong:font-black prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
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
                <div className="p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-white/5 relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-bold text-white">{isZh ? "法律条款疑问" : "Legal Questions"}</h3>
                    <p className="text-slate-400 text-lg leading-relaxed">{isZh ? "如果您对这些服务条款有任何疑问或需要进一步说明，请随时联系我们的法律部门。" : "If you have any questions or need further clarification on these terms, please don't hesitate to contact our legal department."}</p>
                    <a href="mailto:prismcloud@yeah.net" className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors text-lg">prismcloud@yeah.net <ChevronRight size={18} /></a>
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
