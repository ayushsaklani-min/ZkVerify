'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CredibilityScore from './credibility-score';

const ReputationCard = ({ address, compact = false }) => {
  const [reputation, setReputation] = useState(null);
  const [auditorInfo, setAuditorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReputationData();
  }, [address]);

  const fetchReputationData = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
      const [auditorResponse, reputationResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auditors/${address}`),
        fetch(`${BACKEND_URL}/api/auditors/${address}/reputation`)
      ]);

      const auditorData = await auditorResponse.json();
      const reputationData = await reputationResponse.json();

      if (auditorData.success) {
        setAuditorInfo(auditorData.auditor);
      }

      if (reputationData.success) {
        setReputation(reputationData.reputation);
      }
    } catch (error) {
      console.error('Error fetching reputation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshReputation = async () => {
    setRefreshing(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
      await fetch(`${BACKEND_URL}/api/auditors/${address}/refresh-reputation`, {
        method: 'POST'
      });
      await fetchReputationData();
    } catch (error) {
      console.error('Error refreshing reputation:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
      ),
      code4rena: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      immunefi: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    };
    return icons[platform] || icons.github;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-300 rounded w-32"></div>
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!auditorInfo || !auditorInfo.isApproved) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="text-center text-gray-400">
          <p>Auditor not found or not approved</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">
              {formatAddress(address)}
            </h3>
            <p className="text-sm text-gray-300">
              {auditorInfo.credentialCount} credentials issued
            </p>
          </div>
          <CredibilityScore address={address} size="sm" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Auditor Reputation
          </h2>
          <p className="text-gray-300 text-sm">
            {formatAddress(address)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <CredibilityScore 
            address={address} 
            size="md" 
            showBreakdown={true} 
          />
          
          <button
            onClick={refreshReputation}
            disabled={refreshing}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {auditorInfo.credentialCount}
          </div>
          <div className="text-sm text-gray-300">
            Credentials Issued
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {reputation?.github?.count || 0}
          </div>
          <div className="text-sm text-gray-300">
            GitHub Repos
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {((reputation?.code4rena?.count || 0) + (reputation?.immunefi?.count || 0))}
          </div>
          <div className="text-sm text-gray-300">
            Platform Findings
          </div>
        </div>
      </div>

      {/* Platform Links */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-3">
          External Platforms
        </h3>
        
        {auditorInfo.githubHandle && (
          <motion.a
            href={`https://github.com/${auditorInfo.githubHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
            whileHover={{ x: 4 }}
          >
            <div className="text-gray-300 group-hover:text-white">
              {getPlatformIcon('github')}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">GitHub</div>
              <div className="text-gray-300 text-sm">@{auditorInfo.githubHandle}</div>
            </div>
            <div className="text-gray-400 group-hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </motion.a>
        )}
        
        {auditorInfo.code4renaHandle && (
          <motion.a
            href={`https://code4rena.com/@${auditorInfo.code4renaHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
            whileHover={{ x: 4 }}
          >
            <div className="text-gray-300 group-hover:text-white">
              {getPlatformIcon('code4rena')}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Code4rena</div>
              <div className="text-gray-300 text-sm">@{auditorInfo.code4renaHandle}</div>
            </div>
            <div className="text-gray-400 group-hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </motion.a>
        )}
        
        {auditorInfo.immunefiHandle && (
          <motion.a
            href={`https://immunefi.com/profile/${auditorInfo.immunefiHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
            whileHover={{ x: 4 }}
          >
            <div className="text-gray-300 group-hover:text-white">
              {getPlatformIcon('immunefi')}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Immunefi</div>
              <div className="text-gray-300 text-sm">@{auditorInfo.immunefiHandle}</div>
            </div>
            <div className="text-gray-400 group-hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </motion.a>
        )}
      </div>

      {/* Last Updated */}
      {reputation?.lastUpdated && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(reputation.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ReputationCard;