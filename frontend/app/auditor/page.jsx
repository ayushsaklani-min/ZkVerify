"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { GlassCard } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
import { Input } from '@/components/ui/input'
import { AnimatedBadge } from '@/components/ui/animated-badge'
import { issueCredential } from '@/lib/airkit'
import { getContractWithSigner } from '@/lib/ethers'
import { keccak256Utf8, uuidToBytes32 } from '@/lib/hash'
import { FileSignature, Anchor, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AuditorPage() {
  const { address } = useAccount()
  const [project, setProject] = useState("")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [status, setStatus] = useState("Verified - No Critical Issues")
  const [isIssuing, setIsIssuing] = useState(false)
  const [isAnchoring, setIsAnchoring] = useState(false)
  const [credential, setCredential] = useState(null)
  const [isAnchored, setIsAnchored] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem('zkverify:lastCredential')
    if (cached) setCredential(JSON.parse(cached))
  }, [])

  async function handleIssueCredential() {
    if (!address) {
      toast.error('Please connect your wallet as auditor')
      return
    }
    if (!project) {
      toast.error('Please enter project address')
      return
    }
    if (!summary) {
      toast.error('Please enter audit summary')
      return
    }

    console.log('[Auditor] Issue clicked', { project, title, summary, status })
    setIsIssuing(true)
    try {
      const summaryHash = keccak256Utf8(`${title}|${summary}`)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      // Prefer server-issued credential to avoid CORS and secret exposure
      const endpoint = `${BACKEND_URL}/api/issueCredential`
      console.log('[Auditor] POST', endpoint)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuer: address, subject: project, summaryHash, status })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[Auditor] Issue error response', data)
        throw new Error(data?.error || `Issue failed (${res.status})`)
      }
      const data = await res.json()
      console.log('[Auditor] Issue success', data)
      const cred = {
        ...data,
        id: data.credential_id || data.id,
        issuer: address,
        subject: project,
        summaryHash,
        status,
        issuedAt: data.issued_at || new Date().toISOString(),
      }
      setCredential(cred)
      setIsAnchored(false)
      localStorage.setItem('zkverify:lastCredential', JSON.stringify(cred))
      toast.success('✅ Credential issued successfully!')
    } catch (e) {
      console.error('[Auditor] Issue failed', e)
      toast.error(`❌ Failed to issue credential: ${e.message}`)
    } finally {
      setIsIssuing(false)
    }
  }

  async function handleAnchorOnChain() {
    if (!credential) {
      toast.error('Please issue a credential first')
      return
    }
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsAnchoring(true)
    try {
      const contract = await getContractWithSigner()
      const idBytes32 = uuidToBytes32(credential.id)
      const tx = await contract.anchorCredential(
        idBytes32,
        credential.summaryHash,
        address
      )
      await tx.wait()
      setIsAnchored(true)
      toast.success('🎉 Credential anchored on Moca Chain!')
    } catch (e) {
      console.error(e)
      toast.error('❌ Failed to anchor credential')
    } finally {
      setIsAnchoring(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <FileSignature className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Auditor Dashboard</h1>
        <p className="text-white/60 text-lg">Issue verifiable audit credentials and anchor them on-chain</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Issue Credential Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-8 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <FileSignature className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Issue Credential</h2>
                <p className="text-white/50 text-sm">Create an audit credential via AIR Kit</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Project Address
                </label>
                <Input
                  placeholder="0x..."
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-indigo-400 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Audit Title
                </label>
                <Input
                  placeholder="Security Audit Q4 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-indigo-400 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Audit Summary
                </label>
                <textarea
                  placeholder="Brief summary of audit findings..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white placeholder-white/50 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0b0f19]/90 text-white border border-white/20 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                >
                  <option value="Verified - No Critical Issues">Verified - No Critical Issues</option>
                  <option value="Verified - Minor Issues">Verified - Minor Issues</option>
                  <option value="Verified - Major Issues Fixed">Verified - Major Issues Fixed</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>

              <GradientButton
                onClick={handleIssueCredential}
                isLoading={isIssuing}
                disabled={!address}
                className="w-full"
              >
                {isIssuing ? 'Issuing Credential...' : 'Issue Credential'}
              </GradientButton>

              {!address && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Connect wallet to continue</span>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Anchor On-Chain Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-8 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Anchor className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Anchor On-Chain</h2>
                <p className="text-white/50 text-sm">Write credential to Moca Testnet</p>
              </div>
            </div>

            {credential ? (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-white/50 mb-1">Credential ID</div>
                    <div className="font-mono text-sm text-white/90 break-all">{credential.id}</div>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div>
                    <div className="text-xs font-medium text-white/50 mb-1">Summary Hash</div>
                    <div className="font-mono text-sm text-white/90 break-all">{credential.summaryHash}</div>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div>
                    <div className="text-xs font-medium text-white/50 mb-1">Issued At</div>
                    <div className="text-sm text-white/90">{new Date(credential.issuedAt).toLocaleString()}</div>
                  </div>
                </div>

                {isAnchored ? (
                  <AnimatedBadge status="verified" className="w-full justify-center" />
                ) : (
                  <GradientButton
                    onClick={handleAnchorOnChain}
                    isLoading={isAnchoring}
                    disabled={!address}
                    className="w-full"
                  >
                    {isAnchoring ? 'Anchoring...' : 'Anchor to Moca Chain'}
                  </GradientButton>
                )}

                {!isAnchored && (
                  <div className="flex items-start gap-2 text-green-400/80 text-sm">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      Ready to anchor. Only hashed summary and credential ID will be stored on-chain, 
                      preserving privacy of full audit report.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <Anchor className="h-12 w-12 text-white/30" />
                </div>
                <p className="text-white/50 max-w-xs">
                  Issue a credential first to see details and anchor it on-chain
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}