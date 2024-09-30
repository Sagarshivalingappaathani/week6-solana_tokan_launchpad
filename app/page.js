"use client";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import CrateToken from '@/components/CreateToken'


//it s just to avoid hydration error
import dynamic from 'next/dynamic';
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
const WalletDisconnectButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletDisconnectButton),
  { ssr: false }
);


function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  //const endpoint="https://solana-devnet.g.alchemy.com/v2/D2scTsXfiMJgmjkqvigvkwNCwc565itt";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <>
      <div className='bg-white'>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <div className="flex justify-center p-4 bg-white shadow-md space-x-10">
                <WalletMultiButtonDynamic className="btn-primary" />
                <WalletDisconnectButtonDynamic className="btn-secondary" />
              </div>
              <CrateToken/>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>
    </>
  );
}

export default App;

