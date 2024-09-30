import React,{useState} from "react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType } from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { getAssociatedTokenAddressSync ,createAssociatedTokenAccountInstruction, createMintToInstruction} from "@solana/spl-token";

const CreateToken = () => {
    // States for form inputs
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [initialSupply, setInitialSupply] = useState(0);
    const [decimals, setDecimals] = useState(0);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const { connection } = useConnection();
    const wallet = useWallet();

    const handleCreateToken = async () => {
        setLoading(true);
        try {
            if (!wallet || !wallet.publicKey) {
                throw new Error('Wallet not connected');
            }
    
            const mintKeypair = Keypair.generate();
            const metadata = {
                mint: mintKeypair.publicKey,
                name: name,
                symbol: symbol,
                uri: "https://cdn.100xdevs.com/metadata.json",
                additionalMetadata: [],
            };
    
            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
            
            // Get associated token account address (PDA concept)
            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
    
            // Create a single transaction for all steps
            const transaction = new Transaction().add(
                // 1. Create the mint account
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                
                // 2. Initialize metadata pointer for the mint
                createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
                
                // 3. Initialize mint instruction
                createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
                
                // 4. Add metadata to the mint (with name, symbol, URI)
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
                
                // 5. Create the associated token account
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
                
                // 6. Mint initial supply to the associated token account
                createMintToInstruction(
                    mintKeypair.publicKey,
                    associatedToken,
                    wallet.publicKey, // authority
                    100000000000, // Initial supply 
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );
            
            // Add recent blockhash and set fee payer
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
            // Partially sign with mint keypair
            transaction.partialSign(mintKeypair);
            
            // Fully sign and send transaction from the wallet
            await wallet.sendTransaction(transaction, connection);
    
            // Update UI on success
            setStatus(`Token mint created at ${mintKeypair.publicKey.toBase58()} with associated token account at ${associatedToken.toBase58()}`);
            setName('');
            setDecimals('');
            setImageUrl('');
            setInitialSupply('');
            setSymbol('');
    
        } catch (error) {
            console.error('Error creating token:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="max-w-lg mx-auto p-6 bg-gray-900 text-white rounded-md shadow-md mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center">Create Your Solana Token</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Token Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter token name"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter token symbol"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter image URL"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Initial Supply</label>
                <input
                    type="number"
                    value={initialSupply}
                    onChange={(e) => setInitialSupply(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter initial supply"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Decimals</label>
                <input
                    type="number"
                    value={decimals}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter decimals"
                />
            </div>

            <button
                onClick={handleCreateToken}
                className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Token'}
            </button>

            {status && (
                <div className="mt-4 p-4 bg-gray-800 text-sm text-white rounded-md">
                    {status}
                </div>
            )}
        </div>
    );
};

export default CreateToken;
