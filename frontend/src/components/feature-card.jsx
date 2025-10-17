'use client'

import { motion } from 'framer-motion'

export function FeatureCard({ Icon, title, description, gradient = 'from-indigo-500 to-purple-600', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative p-6 md:p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

