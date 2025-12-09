import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TermsModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">服务条款和条件</DialogTitle>
          <DialogDescription className="text-gray-400">
            最后更新：2025年12月9日
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-4 text-sm leading-relaxed">
            <section>
              <h3 className="text-white font-semibold mb-2">1. 条款接受</h3>
              <p>通过访问和使用 Prism Cloud（"本服务"），你同意受这些服务条款约束。如不同意，请勿使用本服务。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">2. 服务描述</h3>
              <p>Prism Cloud 是一个智能信息发布云平台，为企业和组织提供内容管理、多终端分发和数据分析服务。我们保留随时修改、暂停或停止服务任何部分的权利。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">3. 用户账户</h3>
              <p>要访问某些功能，你必须注册账户。你对账户凭证的保密性及账户下发生的所有活动负责。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">4. 用户内容</h3>
              <p>你保留对通过本服务上传或创建的内容的所有权。通过使用本服务，你授予我们全球范围内的非独占许可，用于托管、存储和展示你的内容，仅供提供服务之用。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">5. 禁止行为</h3>
              <p>你同意不将本服务用于任何非法目的，也不传输任何违法、冒犯或侵害他人权利的内容。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">6. 数据安全</h3>
              <p>Prism Cloud 采用行业标准的安全措施保护你的数据。但是，我们无法保证数据安全的绝对性。请妥善保护你的账户信息。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">7. 责任限制</h3>
              <p>Prism Cloud 对因使用或无法使用本服务而产生的任何间接、附带、特殊或后果性损害不承担责任。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">8. 修改和变更</h3>
              <p>我们可能随时修改这些条款。继续使用本服务表示你接受修改后的条款。</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">9. 联系我们</h3>
              <p>如对这些条款有任何疑问，请联系我们的支持团队：support@prism-cloud.com</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
