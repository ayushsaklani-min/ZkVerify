'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';

const VerificationSteps = ({ 
  proofHash, 
  auditorAddress, 
  onVerificationComplete,
  className = "" 
}) => {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatus, setStepStatus] = useState({
    1: 'pending', // pending, active, completed, error
    2: 'pending',
    3: 'pending',
    4: 'pending'
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Connect Wallet',
      description: 'Connect your wallet to verify credentials',
      icon: '🔗'
    },
    {
      id: 2,
      title: 'Enter Details',
      description: 'Provide proof hash or auditor address',
      icon: '📝'
    },
    {
      id: 3,
      title: 'Verify On-Chain',
      description: 'Check credential validity on blockchain',
      icon: '⛓️'
    },
    {
      id: 4,
      title: 'View Results',
      description: 'See verification results and details',
      icon: '✅'
    }
  ];

  useEffect(() => {
    // Step 1: Check wallet connection
    if (isConnected) {
      setStepStatus(prev => ({ ...prev, 1: 'completed' }));
      setCurrentStep(2);
    } else {
      setStepStatus(prev => ({ ...prev, 1: 'active' }));
      setCurrentStep(1);
    }
  }, [isConnected]);

  useEffect(() => {
    // Step 2: Check if we have required data
    if (isConnected && (proofHash || auditorAddress)) {
      setStepStatus(prev => ({ ...prev, 2: 'completed' }));
      setCurrentStep(3);
      // Auto-start verification
      startVerification();
    } else if (isConnected) {
      setStepStatus(prev => ({ ...prev, 2: 'active' }));
    }
  }, [isConnected, proofHash, auditorAddress]);

  const startVerification = async () => {
    setStepStatus(prev => ({ ...prev, 3: 'active' }));
    setError(null);

    try {
      let result = null;

      if (proofHash) {
        // Verify specific proof
        result = await verifyProof(proofHash);
      } else if (auditorAddress) {
        // Verify auditor status
        result = await verifyAuditor(auditorAddress);
      }

      if (result) {
        setStepStatus(prev => ({ ...prev, 3: 'completed', 4: 'active' }));
        setCurrentStep(4);
        setVerificationResult(result);
        
        // Complete final step
        setTimeout(() => {
          setStepStatus(prev => ({ ...prev, 4: 'completed' }));
          if (onVerificationComplete) {
            onVerificationComplete(result);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message);
      setStepStatus(prev => ({ ...prev, 3: 'error' }));
    }
  };

  const verifyProof = async (hash) => {
    // Mock verification - replace with actual contract call
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    // This would be replaced with actual contract interaction
    return {
      type: 'proof',
      hash: hash,
      isValid: true,
      auditor: '0x1234...5678',
      subject: '0xabcd...efgh',
      timestamp: Date.now(),
      transactionHash: '0x9876...4321'
    };
  };

  const verifyAuditor = async (auditorAddr) => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
      const response = await fetch(`${BACKEND_URL}/api/auditors/${auditorAddr}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          type: 'auditor',
          address: auditorAddr,
          isApproved: data.auditor.isApproved,
          credentialCount: data.auditor.credentialCount,
          credibilityScore: data.auditor.credibilityScore,
          githubHandle: data.auditor.githubHandle,
          approvedAt: data.auditor.approvedAt
        };
      } else {
        throw new Error('Auditor not found');
      }
    } catch (err) {
      throw new Error(`Failed to verify auditor: ${err.message}`);
    }
  };

  const getStepIcon = (step, status) => {
    if (status === 'completed') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    if (status === 'active') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        </motion.div>
      );
    }
    
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-lg">
        {step.icon}
      </div>
    );
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6">Verification Process</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            {getStepIcon(step, stepStatus[step.id])}
            
            <div className="flex-1">
              <h4 className={`font-semibold ${getStepColor(stepStatus[step.id])}`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-300">
                {step.description}
              </p>
            </div>
            
            {stepStatus[step.id] === 'active' && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-blue-400 text-sm font-medium"
              >
                Processing...
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {verificationResult && stepStatus[4] === 'completed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <h4 className="text-green-300 font-semibold mb-2">
              ✅ Verification Complete
            </h4>
            
            {verificationResult.type === 'proof' && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Proof Hash:</span>
                  <span className="text-white font-mono">
                    {verificationResult.hash.slice(0, 10)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-green-300">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Auditor:</span>
                  <span className="text-white font-mono">
                    {verificationResult.auditor}
                  </span>
                </div>
              </div>
            )}
            
            {verificationResult.type === 'auditor' && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Address:</span>
                  <span className="text-white font-mono">
                    {verificationResult.address.slice(0, 6)}...{verificationResult.address.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={verificationResult.isApproved ? 'text-green-300' : 'text-red-300'}>
                    {verificationResult.isApproved ? 'Approved' : 'Not Approved'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Credentials:</span>
                  <span className="text-white">{verificationResult.credentialCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Score:</span>
                  <span className="text-white">{verificationResult.credibilityScore}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerificationSteps;