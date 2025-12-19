"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SlideToUnlockProps {
  onUnlock: () => void
  label?: string
  className?: string
}

export function SlideToUnlock({ onUnlock, label = "Slide to confirm", className }: SlideToUnlockProps) {
  const x = useMotionValue(0)
  const [unlocked, setUnlocked] = React.useState(false)

  // Use a fixed width for the track, e.g., 280px. Adjust based on parent container.
  // We'll calculate the actual range in the effect or use a percentage approach.
  const background = useTransform(
    x,
    [0, 200],
    ["rgba(var(--primary), 0)", "rgba(var(--primary), 0.2)"]
  )
  
  const opacity = useTransform(x, [0, 100], [1, 0])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 180) {
      x.set(220)
      setUnlocked(true)
      onUnlock()
    } else {
      x.set(0)
    }
  }

  return (
    <div className={cn("relative h-14 w-full max-w-[300px] bg-muted rounded-2xl overflow-hidden border p-1 shadow-inner", className)}>
      <motion.div 
        style={{ background }}
        className="absolute inset-0 z-0"
      />
      
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-widest text-muted-foreground pointer-events-none z-10"
      >
        {label}
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 220 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={unlocked ? { x: 220 } : {}}
        className="relative z-20 h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
      >
        <ChevronRight className="h-6 w-6 text-primary-foreground" />
      </motion.div>
    </div>
  )
}
