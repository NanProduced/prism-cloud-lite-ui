import * as React from "react"
import type { ItemInstance } from "@headless-tree/core"
import type { TreeInstance } from "@headless-tree/core"
import { ChevronDownIcon } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface TreeContextValue<T> {
  indent: number
  currentItem?: ItemInstance<T>
  tree?: TreeInstance<T>
}

const TreeContext = React.createContext<TreeContextValue<unknown>>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
})

function useTreeContext<T = unknown>() {
  return React.useContext(TreeContext) as TreeContextValue<T>
}

interface TreeProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number
  tree?: TreeInstance<T>
}

function Tree<T = unknown>({ indent = 20, tree, className, ...props }: TreeProps<T>) {
  const containerProps = tree ? (tree.getContainerProps() as React.HTMLAttributes<HTMLDivElement>) : {}

  const mergedProps = { ...props, ...containerProps }
  const { style: propStyle, ...otherProps } = mergedProps

  return (
    <TreeContext.Provider value={{ indent, tree: tree as TreeInstance<unknown> }}>
      <div
        data-slot="tree"
        style={propStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  )
}

interface TreeItemProps<T = unknown>
  extends React.HTMLAttributes<HTMLButtonElement> {
  item: ItemInstance<T>
  asChild?: boolean
}

function TreeItem<T = unknown>({
  item,
  className,
  asChild,
  children,
  ...props
}: TreeItemProps<T>) {
  const { indent } = useTreeContext<T>()

  const itemProps = item.getProps() as React.ButtonHTMLAttributes<HTMLButtonElement>
  const mergedProps = { ...itemProps, ...props }
  const { style: propStyle, ...otherProps } = mergedProps

  const paddingLeft = Math.max(0, item.getItemMeta().level * indent)
  const mergedStyle = {
    ...propStyle,
    paddingLeft,
  } as React.CSSProperties

  const Comp = asChild ? Slot : "button"

  return (
    <TreeContext.Provider value={{ indent, currentItem: item as ItemInstance<unknown> }}>
      <Comp
        data-slot="tree-item"
        style={mergedStyle}
        className={cn(
          "relative z-10 w-full select-none pb-0.5 text-left last:pb-0 focus:z-20 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        data-focus={
          typeof item.isFocused === "function" ? item.isFocused() || false : undefined
        }
        data-folder={
          typeof item.isFolder === "function" ? item.isFolder() || false : undefined
        }
        data-selected={
          typeof item.isSelected === "function" ? item.isSelected() || false : undefined
        }
        data-drag-target={
          typeof item.isDragTarget === "function"
            ? item.isDragTarget() || false
            : undefined
        }
        data-search-match={
          typeof item.isMatchingSearch === "function"
            ? item.isMatchingSearch() || false
            : undefined
        }
        aria-expanded={item.isFolder() ? item.isExpanded() : undefined}
        {...otherProps}
      >
        {children}
      </Comp>
    </TreeContext.Provider>
  )
}

interface TreeItemLabelProps<T = unknown>
  extends React.HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>
  showChevron?: boolean
}

function TreeItemLabel<T = unknown>({
  item: propItem,
  children,
  className,
  showChevron = true,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem } = useTreeContext<T>()
  const item = propItem || currentItem

  if (!item) {
    console.warn("TreeItemLabel: No item provided via props or context")
    return null
  }

  const isSelected =
    typeof item.isSelected === "function" ? item.isSelected() : false
  const isFolder = typeof item.isFolder === "function" ? item.isFolder() : false
  const isDragTarget =
    typeof item.isDragTarget === "function" ? item.isDragTarget() : false
  const isSearchMatch =
    typeof item.isMatchingSearch === "function" ? item.isMatchingSearch() : false

  return (
    <span
      data-slot="tree-item-label"
      data-selected={isSelected}
      data-folder={isFolder}
      data-drag-target={isDragTarget}
      data-search-match={isSearchMatch}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        "data-[drag-target=true]:bg-accent data-[search-match=true]:!bg-blue-50",
        className,
      )}
      {...props}
    >
      {showChevron && item.isFolder() && (
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            item.isExpanded() ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden="true"
        />
      )}
      {children ||
        (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  )
}

function TreeDragLine({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext<unknown>()

  if (!tree || typeof tree.getDragLineStyle !== "function") {
    console.warn(
      "TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method",
    )
    return null
  }

  const dragLine = tree.getDragLineStyle() as React.CSSProperties
  return (
    <div
      style={dragLine}
      className={cn(
        "absolute z-30 -mt-px h-0.5 bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background",
        className,
      )}
      {...props}
    />
  )
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine }
