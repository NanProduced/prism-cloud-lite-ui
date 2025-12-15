import * as React from "react"
import { UploadCloud } from "lucide-react"
import { motion, type HTMLMotionProps } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FileUploadCardProps = Omit<HTMLMotionProps<"div">, "children"> & {
  title?: string
  description?: string
  hint?: string
  chooseLabel?: string
  pasteLabel?: string
  onChooseFiles: () => void
  onPasteFiles: () => void
  onDropFiles: (files: File[]) => void
  children?: React.ReactNode
}

export const FileUploadCard = React.forwardRef<HTMLDivElement, FileUploadCardProps>(
  (
    {
      className,
      title = "Upload assets",
      description = "Drag & drop files here, or choose files to upload.",
      hint = "Images, videos, and documents are supported. Large files use direct-to-S3 upload (no server bandwidth).",
      chooseLabel = "Choose Files",
      pasteLabel = "Paste",
      onChooseFiles,
      onPasteFiles,
      onDropFiles,
      children,
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = React.useState(false)

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      const files = Array.from(event.dataTransfer.files)
      if (files.length === 0) return
      onDropFiles(files)
    }

    const cardVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    }

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.2 }}
        className={cn("w-full rounded-xl border bg-background shadow-sm", className)}
        {...props}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={onChooseFiles}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onChooseFiles()
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "mt-5 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50",
            )}
          >
            <UploadCloud className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Choose files or drag & drop them here</p>
            <p className="mt-1 text-xs text-muted-foreground">Images, videos, and documents. Multiple selection supported.</p>

            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button
                type="button"
                className="gap-2"
                onClick={(event) => {
                  event.stopPropagation()
                  onChooseFiles()
                }}
              >
                <UploadCloud className="h-4 w-4" />
                {chooseLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation()
                  onPasteFiles()
                }}
              >
                {pasteLabel}
              </Button>
            </div>
          </div>

          {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
        </div>

        {children && <div className="border-t p-4">{children}</div>}
      </motion.div>
    )
  },
)
FileUploadCard.displayName = "FileUploadCard"
