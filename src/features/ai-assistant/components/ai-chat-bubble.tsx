import React from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AIChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function AIChatBubble({ isOpen, onClick }: AIChatBubbleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all duration-300 group"
              onClick={onClick}
            >
              <div className="relative">
                <Bot className="h-7 w-7 text-primary-foreground group-hover:rotate-12 transition-transform" />
                <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full shadow-lg bg-background border-muted-foreground/20 hover:bg-muted"
          onClick={onClick}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
