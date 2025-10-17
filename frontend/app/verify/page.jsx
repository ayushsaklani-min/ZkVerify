"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { GlassCard } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
import { Input } from '@/components/ui/input'
import { AnimatedBadge } from '@/components/ui/animated-badge'
import { getReadOnlyContract } from '@/lib/ethers'
import { EXPLORER_URL } from '@/config'
import { Search, ExternalLink, Shield, CheckCircle2, XCircle, User } from 'lucide-react'

export default function VerifyPage() {
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [auditor, setAuditor] = useState(null)

  async function handleVerify() {
    if (!address) {
      toast.error('Please enter a project address')
      return
    }

    setIsLoading(true)
    setResult(null)
    setAuditor(null)

    try {
      const contract = getReadOnlyContract()
      const isVerified = await contract.isVerified(address)
      setResult(isVerified)

      if (isVerified) {
        const auditorAddr = await contract.getAuditor(address)
        setAuditor(auditorAddr)
        toast.success('✅ Project verification found!')
      } else {
        toast.error('❌ No verification found')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to check verification status')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Search className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Verify Audit Status</h1>
        <p className="text-white/60 text-lg">Check on-chain verification for any project address</p>
      </motion.div>

      {/* Search Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GlassCard className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Shield className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Lookup Verification</h2>
              <p className="text-white/50 text-sm">Enter project wallet address</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                className="flex-1 bg-white/5 border-white/20 focus:border-pink-400 text-white"
              />
              <GradientButton
                onClick={handleVerify}
                isLoading={isLoading}
                disabled={!address}
                className="px-6"
              >
                <Search className="h-5 w-5" />
                {isLoading ? 'Checking...' : 'Verify'}
              </GradientButton>
            </div>

            <div className="text-xs text-white/50">
              💡 Tip: Paste the project's wallet address to instantly verify their audit status
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result !== null && (
          <motion.div
            key={result ? 'verified' : 'unverified'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className={`p-8 border-2 ${result ? 'border-green-400/30' : 'border-red-400/30'}`}>
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className={`p-6 rounded-full ${
                    result
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-red-500 to-rose-600'
                  }`}
                >
                  {result ? (
                    <CheckCircle2 className="h-16 w-16 text-white" />
                  ) : (
                    <XCircle className="h-16 w-16 text-white" />
                  )}
                </motion.div>

                {/* Status */}
                <div>
                  <h3 className={`text-3xl font-bold mb-2 ${result ? 'text-green-400' : 'text-red-400'}`}>
                    {result ? 'Audit Verified ✓' : 'Not Verified'}
                  </h3>
                  <p className="text-white/60 max-w-md">
                    {result
                      ? 'This project has a verified audit credential recorded on Moca Chain'
                      : 'No verification record found for this address on-chain'}
                  </p>
                </div>

                {/* Badge */}
                <AnimatedBadge status={result ? 'verified' : 'unverified'} />

                {/* Auditor Info */}
                {result && auditor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-indigo-400" />
                      <span className="font-semibold text-white">Auditor Information</span>
                    </div>
                    <div className="text-sm text-white/50 mb-1">Auditor Address</div>
                    <div className="font-mono text-sm text-white/90 break-all mb-4">{auditor}</div>
                  <a
                    href={`${EXPLORER_URL}/address/${auditor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 pointer-events-auto inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </a>
                  </motion.div>
                )}

                {/* Project Address */}
                <div className="w-full p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Project Address</div>
                  <div className="font-mono text-sm text-white/80 break-all">{address}</div>
                </div>

                {/* Explorer Link */}
                {result && (
                  <a
                    href={`${EXPLORER_URL}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 pointer-events-auto inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white transition-all duration-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Moca Explorer
                  </a>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      {result === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8">
            <h3 className="text-xl font-bold text-white mb-4">How Verification Works</h3>
            <div className="space-y-3 text-white/60 leading-relaxed">
              <p>
                1️⃣ <strong className="text-white">Auditors</strong> issue verifiable credentials to projects after completing audits
              </p>
              <p>
                2️⃣ <strong className="text-white">Projects</strong> generate zero-knowledge proofs without revealing audit details
              </p>
              <p>
                3️⃣ <strong className="text-white">Verification status</strong> is recorded immutably on Moca Chain Testnet
              </p>
              <p>
                4️⃣ <strong className="text-white">Anyone</strong> can verify a project's audit status using their wallet address
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}