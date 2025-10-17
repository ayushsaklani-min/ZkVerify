'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function GradientButton({ children, isLoading, disabled, className, size = 'md', ...props }) {
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-8 py-4 text-base rounded-xl',
    lg: 'px-10 py-5 text-lg rounded-2xl',
  }
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      className={cn(
        "relative font-semibold text-white overflow-hidden",
        "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
        "shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60",
        "transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-pink-500 before:via-purple-500 before:to-indigo-500",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {children}
      </span>
    </motion.button>
  )
}
