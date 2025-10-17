export const mocaChain = {
  id: 5151,
  name: 'Moca Chain Testnet',
  network: 'moca-testnet',
  nativeCurrency: { name: 'Moca', symbol: 'MOCA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.mocachain.org'] },
    public: { http: ['https://testnet-rpc.mocachain.org'] },
  },
  blockExplorers: {
    default: { name: 'MocaScan', url: 'https://testnet-scan.mocachain.org' },
  },
};

