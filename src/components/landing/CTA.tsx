import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export const CTA = () => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  const handleCheckedChange = (checked: boolean) => {
    setChecked(checked);
    if (checked) {
      setTimeout(() => {
        window.location.href = "/register";
      }, 300);
    }
  };

  return (
    <section className="relative w-full py-32 overflow-hidden bg-black">
      {/* 深色背景 */}
      <div className="absolute inset-0 bg-black" />

      {/* 蓝紫色径向光晕 - 加强版，更明显 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.4)_0%,rgba(79,70,229,0.25)_20%,rgba(30,58,138,0.15)_50%,transparent_100%)]" />

      {/* 内容区域 */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center gap-12 px-4 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* 主标题：It's time to make [SPHERE] switch */}
        <div className="flex flex-col items-center gap-6">
          {/* 第一行：It's time to make */}
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white text-center leading-tight tracking-tight">
            It's time to make
          </h2>

          {/* 第二行：the [Switch] switch */}
          <div className="flex items-center justify-center gap-6 md:gap-8 lg:gap-10 flex-wrap">
            <motion.span
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white text-center leading-tight tracking-tight"
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              the
            </motion.span>

            {/* Shadcn Switch */}
            <div className="flex items-center">
                <Switch 
                    checked={checked}
                    onCheckedChange={handleCheckedChange}
                    className="scale-[2.5] md:scale-[3] bg-white/10 data-[state=checked]:bg-[#B6F09C] border-2 border-white/20"
                />
            </div>

            <motion.span
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white text-center leading-tight tracking-tight"
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
            >
              switch
            </motion.span>
          </div>
        </div>

        {/* 副标题 */}
        <motion.p
          className="text-center text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t("cta.subtitle")}
        </motion.p>
      </motion.div>
    </section>
  );
};
