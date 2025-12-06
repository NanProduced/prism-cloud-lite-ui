import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DesignerCardSplashProps {
  onComplete: () => void;
  duration?: number; // 加载时长（毫秒）
}

/**
 * Designer Card Splash Screen
 * 专业加载页面，展示个人品牌和设计组合
 * 布局和尺寸与 Figma 设计完全一致（固定尺寸）
 */
export const DesignerCardSplash: React.FC<DesignerCardSplashProps> = ({
  onComplete,
  duration = 2500,
}) => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 加载进度效果
  useEffect(() => {
    if (isLoaded) return;

    const interval = 25;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsLoaded(true);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isLoaded]);

  // 容器过渡动画（淡出）
  const containerVariants = {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: { duration: 1 },
    },
  };

  // 处理全局点击（加载完成后可以点击任何地方进入）
  const handleGlobalClick = () => {
    if (isLoaded && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isTransitioning && (
        <motion.div
          key="splash"
          variants={containerVariants}
          initial="initial"
          exit="exit"
          className="fixed inset-0 z-50 bg-black overflow-hidden"
          style={{ width: '100vw', height: '100vh' }}
          onClick={handleGlobalClick}
        >
          {/* 背景几何体 1 - 右上方，缓慢浮动和旋转 */}
          {/* 尺寸: 1478x1478, 位置: left 320px, top -373px */}
          <motion.div
            className="absolute"
            style={{
              left: '320px',
              top: '-373px',
              width: '1478px',
              height: '1478px',
              opacity: 0.6,
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [0, 2, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 15,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <img
              src="/assets/svg/vector_1.svg"
              alt="Background geometric 1"
              className="w-full h-full object-cover opacity-40 mix-blend-screen pointer-events-none"
            />
          </motion.div>

          {/* 背景几何体 2 - 左上方，不同的浮动节奏 */}
          {/* 尺寸: 681x681, 位置: left 84px, top -307px */}
          <motion.div
            className="absolute"
            style={{
              left: '84px',
              top: '-307px',
              width: '681px',
              height: '681px',
              opacity: 0.5,
            }}
            animate={{
              y: [0, 30, 0],
              x: [0, 15, 0],
              rotate: [0, -1, 0],
            }}
            transition={{
              duration: 10,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 0.5,
            }}
          >
            <img
              src="/assets/svg/vector_2.svg"
              alt="Background geometric 2"
              className="w-full h-full object-cover opacity-35 mix-blend-screen pointer-events-none"
            />
          </motion.div>

          {/* 背景几何体 3 - 中间位置 */}
          {/* 尺寸: 903x903, 位置: left 84px, top -131px */}
          <motion.div
            className="absolute"
            style={{
              left: '84px',
              top: '-131px',
              width: '903px',
              height: '903px',
              opacity: 0.5,
            }}
            animate={{
              rotate: [0, -3, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 1,
            }}
          >
            <img
              src="/assets/svg/vector_3.svg"
              alt="Background geometric 3"
              className="w-full h-full object-cover opacity-30 mix-blend-screen pointer-events-none"
            />
          </motion.div>

          {/* 标题区域 - 左下角（固定位置） */}
          {/* 位置: left 64px, bottom 128px */}
          <motion.div
            className="absolute z-10"
            style={{
              left: '64px',
              bottom: '128px',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest font-light mb-2">
              Design Portfolio
            </p>
            <h1 className="text-7xl font-black text-white uppercase leading-tight tracking-tighter whitespace-nowrap">
              Nan <span className="text-gray-500">Produced</span>
            </h1>
          </motion.div>

          {/* 进度/Enter 区域 - 右下角（固定位置） */}
          {/* 位置: right 64px, bottom 128px */}
          <motion.div
            className="absolute z-10"
            style={{
              right: '64px',
              bottom: '128px',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex flex-col items-end justify-end">
              <AnimatePresence mode="wait">
                {!isLoaded ? (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-end gap-4"
                  >
                    <div className="text-6xl font-light text-white tracking-tighter leading-none">
                      {Math.floor(progress)}%
                    </div>
                    <div className="h-1 w-40 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="enter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ x: 5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTransitioning(true);
                      setTimeout(onComplete, 1000);
                    }}
                    className="group flex items-center justify-end gap-3 text-white hover:text-gray-300 transition-colors py-2 text-xl font-light tracking-[0.2em] uppercase"
                  >
                    <span>Enter</span>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 底部提示文字 - 只在加载完成后显示 */}
          {/* 位置: 底部中央 */}
          <AnimatePresence>
            {isLoaded && (
              <motion.div
                className="absolute z-10"
                style={{
                  bottom: '32px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white/30 text-xs font-light tracking-[0.2em] uppercase whitespace-nowrap">
                  Click anywhere to enter
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DesignerCardSplash;
