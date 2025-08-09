import { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

const MintINFT = ({ contractAddress, contractABI }) => {
  const { address } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [encryptedURI, setEncryptedURI] = useState("");
  const [metadata, setMetadata] = useState({
    name: "",
    description: "",
    modelType: "",
    capabilities: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Generate metadata hash
  const generateMetadataHash = () => {
    const metadataString = JSON.stringify(metadata);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(metadataString));
  };

  // Encrypt metadata (simplified for demo)
  const encryptMetadata = () => {
    const metadataString = JSON.stringify(metadata);
    // In production, use proper encryption
    const encrypted = btoa(metadataString);
    return `data:application/json;base64,${encrypted}`;
  };

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "mint",
    args: [
      recipientAddress || address,
      encryptedURI || encryptMetadata(),
      generateMetadataHash()
    ],
    enabled: Boolean(recipientAddress || address) && Boolean(metadata.name),
  });

  const { data, write } = useContractWrite(config);

  const { isLoading: isTransactionLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      toast.success("INFT minted successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Minting failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setRecipientAddress("");
    setEncryptedURI("");
    setMetadata({
      name: "",
      description: "",
      modelType: "",
      capabilities: []
    });
  };

  const handleMint = async () => {
    if (!metadata.name) {
      toast.error("Please provide a name for the INFT");
      return;
    }

    setIsLoading(true);
    try {
      if (!encryptedURI) {
        const encrypted = encryptMetadata();
        setEncryptedURI(encrypted);
      }
      write?.();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapabilityAdd = (capability) => {
    if (capability && !metadata.capabilities.includes(capability)) {
      setMetadata({
        ...metadata,
        capabilities: [...metadata.capabilities, capability]
      });
    }
  };

  const handleCapabilityRemove = (index) => {
    const newCapabilities = metadata.capabilities.filter((_, i) => i !== index);
    setMetadata({
      ...metadata,
      capabilities: newCapabilities
    });
  };

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Mint INFT</h2>
        
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Recipient Address (optional)</span>
          </label>
          <input
            type="text"
            placeholder={address || "0x..."}
            className="input input-bordered w-full"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">INFT Name*</span>
          </label>
          <input
            type="text"
            placeholder="My AI Agent"
            className="input input-bordered w-full"
            value={metadata.name}
            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            placeholder="Describe your AI agent..."
            className="textarea textarea-bordered h-24"
            value={metadata.description}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Model Type</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={metadata.modelType}
            onChange={(e) => setMetadata({ ...metadata, modelType: e.target.value })}
          >
            <option value="">Select model type</option>
            <option value="GPT">GPT</option>
            <option value="BERT">BERT</option>
            <option value="Custom">Custom</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Capabilities</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add capability"
              className="input input-bordered flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCapabilityAdd(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {metadata.capabilities.map((cap, index) => (
              <div key={index} className="badge badge-primary gap-2">
                {cap}
                <button
                  onClick={() => handleCapabilityRemove(index)}
                  className="btn btn-ghost btn-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Encrypted URI (optional)</span>
          </label>
          <input
            type="text"
            placeholder="ipfs://... or leave empty for auto-encryption"
            className="input input-bordered w-full"
            value={encryptedURI}
            onChange={(e) => setEncryptedURI(e.target.value)}
          />
        </div>

        <div className="card-actions justify-end mt-6">
          <button
            className="btn btn-primary"
            onClick={handleMint}
            disabled={!write || isLoading || isTransactionLoading || !metadata.name}
          >
            {isLoading || isTransactionLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Mint INFT"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MintINFT;