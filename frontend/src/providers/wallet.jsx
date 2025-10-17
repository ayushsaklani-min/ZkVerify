'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { mocaChain } from '@/lib/chain'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [mocaChain],
  transports: {
    [mocaChain.id]: http(mocaChain.rpcUrls.default.http[0])
  },
  connectors: [
    injected({ shimDisconnect: true })
  ],
  multiInjectedProviderDiscovery: false,
})

const queryClient = new QueryClient()

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

