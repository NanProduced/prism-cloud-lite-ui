import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function TermsModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-[#0F1115] border-[#2A2E33] p-0 gap-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-[#2A2E33] bg-[#131619]">
          <DialogTitle className="text-white text-2xl font-semibold tracking-tight">Terms of Service</DialogTitle>
          <DialogDescription className="text-[#9B9C9E] mt-1.5 flex items-center gap-2 text-sm">
            <span>Last Updated: December 24, 2025</span>
            <span className="w-1 h-1 rounded-full bg-[#363A3D]" />
            <span>Effective immediately</span>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full bg-[#0F1115] pr-4">
          <div className="px-8 py-8 space-y-8">
            {/* Introduction */}
            <div className="space-y-4">
              <h3 className="text-[#B6F09C] text-sm font-bold uppercase tracking-widest">Introduction</h3>
              <p className="text-[#CDCECF] leading-7 text-[15px]">
                Welcome to Prism Cloud. By accessing our website and using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
              </p>
            </div>

            <Separator className="bg-[#2A2E33]" />

            {/* Sections */}
            <div className="grid gap-8">
              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">1</span>
                  Acceptance of Terms
                </h4>
                <p className="text-[#9B9C9E] leading-7 pl-9">
                  By creating an account or using Prism Cloud services ("the Service"), you acknowledge that you have read, understood, and agree to these Terms. If you do not agree, you must stop using the Service immediately.
                </p>
              </section>

              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">2</span>
                  User Account & Security
                </h4>
                <p className="text-[#9B9C9E] leading-7 pl-9">
                  To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Prism Cloud reserves the right to terminate accounts that violate these terms.
                </p>
              </section>

              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">3</span>
                  Intellectual Property & Content
                </h4>
                <p className="text-[#9B9C9E] leading-7 pl-9">
                  You retain ownership of any content you upload to the Service ("User Content"). By uploading content, you grant Prism Cloud a worldwide, non-exclusive license to host, store, and display such content solely for the purpose of providing the Service.
                </p>
              </section>

              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">4</span>
                  Prohibited Activities
                </h4>
                <ul className="list-disc text-[#9B9C9E] leading-7 pl-14 space-y-1">
                  <li>Using the Service for any illegal or unauthorized purpose.</li>
                  <li>Interfering with or disrupting the integrity or performance of the Service.</li>
                  <li>Attempting to gain unauthorized access to the Service or its related systems.</li>
                  <li>Uploading malicious code, viruses, or harmful content.</li>
                </ul>
              </section>

              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">5</span>
                  Privacy & Data Protection
                </h4>
                <p className="text-[#9B9C9E] leading-7 pl-9">
                  Your privacy is important to us. Our use of your personal information is governed by our Privacy Policy. By using the Service, you consent to our collection and use of personal data as outlined therein.
                </p>
              </section>

              <section>
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2E33] text-[#82DBF7] text-xs font-bold">6</span>
                  Limitation of Liability
                </h4>
                <p className="text-[#9B9C9E] leading-7 pl-9">
                  Prism Cloud shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>
            </div>
            
            <div className="h-8" />
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t border-[#2A2E33] bg-[#131619] flex justify-between items-center">
          <p className="text-[#686B6E] text-sm">
            Questions? Contact <span className="text-[#82DBF7] cursor-pointer hover:underline">legal@prism-cloud.com</span>
          </p>
          <div className="flex gap-4">
            <button className="text-[#CDCECF] hover:text-white text-sm font-medium transition-colors">Decline</button>
            <button className="bg-[#B6F09C] hover:bg-[#A2E085] text-[#0C1132] px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-[0_2px_8px_rgba(182,240,156,0.2)]">
              I Agree
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}