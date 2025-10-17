'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AnimatedBadge({ status = 'pending', className }) {
  const variants = {
    verified: {
      icon: CheckCircle,
      text: 'Verified',
      className: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40 text-green-300',
      pulse: true
    },
    unverified: {
      icon: XCircle,
      text: 'Not Verified',
      className: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/40 text-red-300',
      pulse: false
    },
    pending: {
      icon: Clock,
      text: 'Pending',
      className: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/40 text-yellow-300',
      pulse: false
    },
    loading: {
      icon: Loader2,
      text: 'Processing',
      className: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/40 text-blue-300',
      pulse: false,
      spin: true
    }
  }

  const config = variants[status] || variants.pending
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm',
        config.className,
        className
      )}
    >
      <Icon 
        className={cn('h-5 w-5', config.spin && 'animate-spin')} 
      />
      <span>{config.text}</span>
      {config.pulse && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}
