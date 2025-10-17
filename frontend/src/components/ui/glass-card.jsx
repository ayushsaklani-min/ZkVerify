'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function GlassCard({ children, className, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
