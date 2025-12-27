"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Info,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNotificationStore, type Notification } from "@/store/notificationStore";

const TONE_CONFIGS = {
  success: {
    icon: CheckCircle,
    toneClassName: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    toneClassName: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    toneClassName: "text-yellow-500",
  },
  info: {
    icon: Info,
    toneClassName: "text-blue-500",
  },
};

export function NotificationCenter() {
  const { notifications, removeNotification } = useNotificationStore();
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed right-4 top-20 z-[100] flex w-full max-w-[400px] flex-col gap-3 sm:right-6"
    >
      <AnimatePresence initial={false}>
        {notifications.map((notification) => (
          <NotificationBar
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

type NotificationBarProps = {
  notification: Notification;
  onDismiss: () => void;
  prefersReducedMotion: boolean;
};

function NotificationBar({
  notification,
  onDismiss,
  prefersReducedMotion,
}: NotificationBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = TONE_CONFIGS[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      role="listitem"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
      className="pointer-events-auto"
    >
      <Card className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-lg backdrop-blur-md">
        <div
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/80",
            config.toneClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-tight">{notification.title}</h3>
              <p className="text-sm text-foreground/80 leading-snug">{notification.message}</p>
            </div>
            
            <div className="flex items-center gap-1">
              {notification.description && (
                <motion.button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  aria-expanded={isExpanded}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/40 text-foreground/60 transition-colors hover:text-foreground"
                >
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.2,
                      ease: "easeOut",
                    }}
                    className="flex"
                  >
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </motion.span>
                </motion.button>
              )}
              
              <motion.button
                type="button"
                onClick={onDismiss}
                className="rounded-full p-1 text-foreground/60 transition-colors hover:text-foreground"
                aria-label={`Dismiss notification`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </div>
          </div>
          
          <AnimatePresence initial={false}>
            {isExpanded && notification.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.25,
                  ease: "easeOut",
                }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-3 border-t border-border/40 pt-3 text-sm text-foreground/70">
                  <p>{notification.description}</p>
                  {notification.action && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          notification.action?.onClick();
                          onDismiss();
                        }}
                        className="rounded-full text-xs h-7"
                      >
                        {notification.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}