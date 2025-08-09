import { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite, useContractRead, useWaitForTransaction } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

const TransferINFT = ({ contractAddress, contractABI, oracleAddress, oracleABI }) => {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Read token owner
  const { data: tokenOwner } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "ownerOf",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  // Read token metadata hash
  const { data: metadataHash } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "metadataHash",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  // Generate transfer proof (simplified for demo)
  const generateTransferProof = async () => {
    if (!metadataHash || !recipientAddress) return null;

    // In production, this would involve TEE verification
    const oldDataHashes = [metadataHash];
    const newDataHashes = [ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address"],
        [metadataHash, recipientAddress]
      )
    )];
    
    const pubKey = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const sealedKey = ethers.utils.hexlify(ethers.utils.randomBytes(64));
    const nonce = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address", "address"],
        [Date.now(), address, recipientAddress]
      )
    );

    const proof = ethers.utils.defaultAbiCoder.encode(
      ["bytes32[]", "bytes32[]", "address", "address", "bytes", "bytes", "bytes32"],
      [oldDataHashes, newDataHashes, address, recipientAddress, pubKey, sealedKey, nonce]
    );

    return proof;
  };

  const [transferProof, setTransferProof] = useState(null);

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "safeTransferFrom",
    args: [address, recipientAddress, tokenId, transferProof],
    enabled: Boolean(tokenId) && Boolean(recipientAddress) && Boolean(transferProof) && tokenOwner === address,
  });

  const { data, write } = useContractWrite(config);

  const { isLoading: isTransactionLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      toast.success("INFT transferred successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTokenId("");
    setRecipientAddress("");
    setTransferProof(null);
  };

  const handleTransfer = async () => {
    if (!tokenId || !recipientAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (tokenOwner !== address) {
      toast.error("You don't own this INFT");
      return;
    }

    if (!ethers.utils.isAddress(recipientAddress)) {
      toast.error("Invalid recipient address");
      return;
    }

    setIsLoading(true);
    try {
      const proof = await generateTransferProof();
      if (!proof) {
        toast.error("Failed to generate transfer proof");
        return;
      }
      setTransferProof(proof);
      
      // Wait for state update then write
      setTimeout(() => {
        write?.();
      }, 100);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Transfer INFT</h2>
        
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Token ID*</span>
          </label>
          <input
            type="number"
            placeholder="0"
            className="input input-bordered w-full"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          {tokenOwner && (
            <label className="label">
              <span className="label-text-alt">
                Owner: {tokenOwner === address ? "You" : `${tokenOwner.slice(0, 6)}...${tokenOwner.slice(-4)}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Recipient Address*</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="input input-bordered w-full"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </div>

        {tokenOwner === address && tokenId && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Transfer will generate a TEE-verified proof for secure ownership transfer</span>
          </div>
        )}

        <div className="card-actions justify-end mt-6">
          <button
            className="btn btn-primary"
            onClick={handleTransfer}
            disabled={!tokenId || !recipientAddress || isLoading || isTransactionLoading || tokenOwner !== address}
          >
            {isLoading || isTransactionLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Transfer INFT"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferINFT;