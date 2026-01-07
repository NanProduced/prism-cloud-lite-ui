import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Scale, FileText, Clock } from "lucide-react";

const markdown = `**Terms & Conditions**  

These terms and conditions apply to the Prism Cloud Lite app (hereby referred to as "Application") for mobile devices that was created by NanProduced (hereby referred to as "Service Provider") as a Free service.

Upon downloading or utilizing the Application, you are automatically agreeing to the following terms. It is strongly advised that you thoroughly read and understand these terms prior to using the Application.

Unauthorized copying, modification of the Application, any part of the Application, or our trademarks is strictly prohibited. Any attempts to extract the source code of the Application, translate the Application into other languages, or create derivative versions are not permitted. All trademarks, copyrights, database rights, and other intellectual property rights related to the Application remain the property of the Service Provider.

The Service Provider is dedicated to ensuring that the Application is as beneficial and efficient as possible. As such, they reserve the right to modify the Application or charge for their services at any time and for any reason. The Service Provider assures you that any charges for the Application or its services will be clearly communicated to you.

The Application stores and processes personal data that you have provided to the Service Provider in order to provide the Service. It is your responsibility to maintain the security of your phone and access to the Application. The Service Provider strongly advise against jailbreaking or rooting your phone, which involves removing software restrictions and limitations imposed by the official operating system of your device. Such actions could expose your phone to malware, viruses, malicious programs, compromise your phone's security features, and may result in the Application not functioning correctly or at all.

Please be aware that the Service Provider does not assume responsibility for certain aspects. Some functions of the Application require an active internet connection, which can be Wi-Fi or provided by your mobile network provider. The Service Provider cannot be held responsible if the Application does not function at full capacity due to lack of access to Wi-Fi or if you have exhausted your data allowance.

If you are using the application outside of a Wi-Fi area, please be aware that your mobile network provider's agreement terms still apply. Consequently, you may incur charges from your mobile provider for data usage during the connection to the application, or other third-party charges. By using the application, you accept responsibility for any such charges, including roaming data charges if you use the application outside of your home territory (i.e., region or country) without disabling data roaming. If you are not the bill payer for the device on which you are using the application, they assume that you have obtained permission from the bill payer.

Similarly, the Service Provider cannot always assume responsibility for your usage of the application. For instance, it is your responsibility to ensure that your device remains charged. If your device runs out of battery and you are unable to access the Service, the Service Provider cannot be held responsible.      

In terms of the Service Provider's responsibility for your use of the application, it is important to note that while they strive to ensure that it is updated and accurate at all times, they do rely on third parties to provide information to them so that they can make it available to you. The Service Provider accepts no liability for any loss, direct or indirect, that you experience as a result of relying entirely on this functionality of the application.

The Application incorporates Artificial Intelligence (AI) technologies to provide certain features or services. By using the Application, you acknowledge and agree that AI may be used to process data and deliver functionalities. The Service Provider ensures that all AI usage complies with applicable laws and is designed to benefit the user experience.

The Service Provider may wish to update the application at some point. The application is currently available as per the requirements for the operating system (and for any additional systems they decide to extend the availability of the application to) may change, and you will need to download the updates if you want to continue using the application. The Service Provider does not guarantee that it will always update the application so that it is relevant to you and/or compatible with the particular operating system version installed on your device. However, you agree to always accept updates to the application when offered to you. The Service Provider may also wish to cease providing the application and may terminate its use at any time without providing termination notice to you. Unless they inform you otherwise, upon any termination, (a) the rights and licenses granted to you in these terms will end; (b) you must cease using the application, and (if necessary) delete it from your device.

**Changes to These Terms and Conditions**

The Service Provider may periodically update their Terms and Conditions. Therefore, you are advised to review this page regularly for any changes. The Service Provider will notify you of any changes by posting the new Terms and Conditions on this page.

These terms and conditions are effective as of 2026-01-01

**Contact Us**

If you have any questions or suggestions about the Terms and Conditions, please do not hesitate to contact the Service Provider at prismcloud@yeah.net.
`;

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-400 text-xs font-black uppercase tracking-widest mb-8"
              >
                <Scale size={14} />
                Legal Framework
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight">
                Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Service</span>
              </h1>
              <div className="flex items-center justify-center gap-4 text-slate-400 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> Last updated: January 01, 2026
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1.5">
                  <FileText size={14} /> Terms & Conditions
                </span>
              </div>
            </div>

            {/* Content Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d0d0d] border border-white/5 rounded-[40px] p-8 md:p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
                <Scale size={400} />
              </div>

              <div className="prose prose-invert prose-slate max-w-none 
                prose-headings:font-black prose-headings:tracking-tighter 
                prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/5
                prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg
                prose-li:text-slate-400 prose-li:text-lg prose-li:leading-relaxed
                prose-strong:text-white prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </motion.div>

            {/* Support Box */}
            <div className="mt-12 p-8 rounded-3xl bg-purple-500/5 border border-purple-500/10 text-center">
              <p className="text-slate-400 font-medium mb-4">
                Have questions about our terms?
              </p>
              <a 
                href="mailto:prismcloud@yeah.net" 
                className="text-purple-400 font-black hover:text-purple-300 transition-colors"
              >
                prismcloud@yeah.net
              </a>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
