import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FaultyTerminalProps {
  text: string[];
  className?: string;
}

export const FaultyTerminal: React.FC<FaultyTerminalProps> = ({
  text,
  className = "",
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeWriter = () => {
      if (currentLineIndex < text.length) {
        const currentText = text[currentLineIndex];

        if (currentCharIndex < currentText.length) {
          setLines((prev) => {
            const newLines = [...prev];
            if (newLines[currentLineIndex] === undefined) {
              newLines[currentLineIndex] = "";
            }
            newLines[currentLineIndex] = currentText.substring(0, currentCharIndex + 1);
            return newLines;
          });
          currentCharIndex++;
          timeoutId = setTimeout(typeWriter, 30 + Math.random() * 50);
        } else {
          currentLineIndex++;
          currentCharIndex = 0;
          timeoutId = setTimeout(typeWriter, 500);
        }
      }
    };

    timeoutId = setTimeout(typeWriter, 1000);

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`font-mono text-sm p-4 rounded-lg bg-[#1e1e1e] border border-white/10 text-green-400 overflow-hidden relative ${className}`}
    >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
      <div className="flex gap-2 mb-3 border-b border-white/5 pb-2">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <div className="space-y-1 relative z-10">
        {lines.map((line, i) => (
          <div key={i} className="min-h-[20px]">
            <span className="text-blue-400 mr-2">➜</span>
            <span className="text-pink-400 mr-2">~</span>
            {line}
          </div>
        ))}
        <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-green-400 inline-block align-middle ml-1"
        />
      </div>
    </div>
  );
};
