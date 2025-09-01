"use client"

import * as React from "react"
import { Toaster as Sonner } from "sonner"

import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <Sonner
      className={cn(className)}
      toastOptions={{
        classNames: {
          toast:
            "group border-border bg-background text-foreground flex flex-row w-full items-center gap-x-2 rounded-md p-4 shadow-lg",
          description: "text-sm text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-input px-3 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          cancelButton:
            "border-border hover:bg-secondary hover:text-secondary-foreground inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          error: "group border-destructive bg-destructive text-destructive-foreground",
          info: "group border-blue-200 bg-blue-100 text-blue-900",
          warning: "group border-yellow-200 bg-yellow-100 text-yellow-900",
          success: "group border-green-200 bg-green-100 text-green-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, { description });
  },
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, { description });
  },
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, { description });
  },
};
