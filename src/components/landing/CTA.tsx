import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * 优雅的滑动开关按钮组件
 * 点击后有 spring 动画，动画完成后跳转页面
 */
const ToggleSwitchBall = ({ onSlideComplete }: { onSlideComplete: () => void }) => {
  const [isOn, setIsOn] = useState(false);

  const handleClick = () => {
    setIsOn(true);
    // 等待 spring 动画完成后再调用回调（约 600ms）
    setTimeout(() => {
      onSlideComplete();
    }, 600);
  };

  return (
    <button
      className="group relative h-32 w-60 shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/5 p-3.5 shadow-inner backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      onClick={handleClick}
      disabled={isOn}
      role="switch"
      aria-checked={isOn}
      aria-label="Slide to switch"
    >
      {/* Knob - 白色滑块 */}
      <motion.div
        className="relative h-full aspect-square rounded-full bg-gradient-to-b from-white to-neutral-200 shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] ring-1 ring-black/5"
        initial={false}
        animate={{ x: isOn ? 114 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {/* 高光效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 to-transparent" />
      </motion.div>
    </button>
  );
};

export const CTA = () => {
  const { t } = useTranslation();

  const handleSlideComplete = () => {
    window.location.href = "/signup";
  };

  return (
    <section className="relative w-full py-24 overflow-hidden bg-black">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-black" />

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

          {/* 第二行：the [滑动按钮] switch */}
          <div className="flex items-center justify-center gap-3 md:gap-5 lg:gap-8 flex-wrap">
            <motion.span
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white text-center leading-tight tracking-tight"
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              the
            </motion.span>

            {/* 滑动按钮 - 这是实际的CTA! */}
            <ToggleSwitchBall onSlideComplete={handleSlideComplete} />

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
