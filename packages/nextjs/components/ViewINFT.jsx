import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

const ViewINFT = ({ contractAddress, contractABI }) => {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const [decryptedMetadata, setDecryptedMetadata] = useState(null);
  const [authorizationUser, setAuthorizationUser] = useState("");
  const [authorizationDuration, setAuthorizationDuration] = useState("3600"); // 1 hour

  // Read token data
  const { data: tokenURI } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "tokenURI",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  const { data: tokenOwner } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "ownerOf",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  const { data: metadataHash } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "metadataHash",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  const { data: isAuthorized } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "isAuthorized",
    args: [tokenId, address],
    enabled: Boolean(tokenId) && Boolean(address),
  });

  const { data: inftData } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "getINFTData",
    args: [tokenId],
    enabled: Boolean(tokenId),
  });

  // Authorize usage preparation
  const { config: authConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "authorizeUsage",
    args: [tokenId, authorizationUser, authorizationDuration],
    enabled: Boolean(tokenId) && Boolean(authorizationUser) && tokenOwner === address,
  });

  const { write: authorizeWrite } = useContractWrite(authConfig);

  // Decrypt metadata (simplified demo)
  const decryptMetadata = async () => {
    if (!tokenURI || !isAuthorized) return;

    try {
      // In production, this would involve proper decryption
      if (tokenURI.startsWith("data:application/json;base64,")) {
        const base64Data = tokenURI.replace("data:application/json;base64,", "");
        const decrypted = atob(base64Data);
        const metadata = JSON.parse(decrypted);
        setDecryptedMetadata(metadata);
      } else {
        // Fetch from IPFS or other URI
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        setDecryptedMetadata(metadata);
      }
    } catch (error) {
      console.error("Decryption failed:", error);
      toast.error("Failed to decrypt metadata");
    }
  };

  useEffect(() => {
    if (isAuthorized && tokenURI) {
      decryptMetadata();
    } else {
      setDecryptedMetadata(null);
    }
  }, [isAuthorized, tokenURI]);

  const handleAuthorize = () => {
    if (!authorizationUser || !tokenId) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!ethers.utils.isAddress(authorizationUser)) {
      toast.error("Invalid user address");
      return;
    }

    authorizeWrite?.();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="card w-full max-w-4xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">View INFT</h2>
        
        <div className="form-control w-full mb-6">
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
        </div>

        {tokenId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Information */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg">Token Information</h3>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Owner:</span>
                    <p className="text-sm break-all">
                      {tokenOwner ? (
                        tokenOwner === address ? "You" : tokenOwner
                      ) : "Loading..."}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold">Metadata Hash:</span>
                    <p className="text-xs break-all font-mono">
                      {metadataHash || "Loading..."}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold">Token URI:</span>
                    <p className="text-xs break-all">
                      {tokenURI ? tokenURI.slice(0, 50) + "..." : "Loading..."}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold">Access Status:</span>
                    <p className={`badge ${isAuthorized ? 'badge-success' : 'badge-warning'}`}>
                      {isAuthorized ? "Authorized" : "Not Authorized"}
                    </p>
                  </div>
                </div>

                {inftData && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <span className="font-semibold">Created:</span>
                      <p className="text-sm">{formatTimestamp(inftData[3])}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Last Updated:</span>
                      <p className="text-sm">{formatTimestamp(inftData[4])}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Visibility:</span>
                      <p className={`badge ${inftData[5] ? 'badge-info' : 'badge-primary'}`}>
                        {inftData[5] ? "Public" : "Private"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Decrypted Metadata */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg">Metadata</h3>
                
                {!isAuthorized ? (
                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>You need authorization to view metadata</span>
                  </div>
                ) : decryptedMetadata ? (
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold">Name:</span>
                      <p>{decryptedMetadata.name}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Description:</span>
                      <p className="text-sm">{decryptedMetadata.description}</p>
                    </div>
                    
                    {decryptedMetadata.modelType && (
                      <div>
                        <span className="font-semibold">Model Type:</span>
                        <p className="badge badge-secondary">{decryptedMetadata.modelType}</p>
                      </div>
                    )}
                    
                    {decryptedMetadata.capabilities && decryptedMetadata.capabilities.length > 0 && (
                      <div>
                        <span className="font-semibold">Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {decryptedMetadata.capabilities.map((cap, index) => (
                            <span key={index} className="badge badge-outline badge-sm">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Authorization Section - Only for token owners */}
        {tokenOwner === address && (
          <div className="card bg-base-300 mt-6">
            <div className="card-body">
              <h3 className="card-title text-lg">Authorize Access</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">User Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="input input-bordered input-sm"
                    value={authorizationUser}
                    onChange={(e) => setAuthorizationUser(e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Duration (seconds)</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={authorizationDuration}
                    onChange={(e) => setAuthorizationDuration(e.target.value)}
                  >
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">1 Week</option>
                    <option value="2592000">1 Month</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">&nbsp;</span>
                  </label>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAuthorize}
                    disabled={!authorizationUser || !authorizeWrite}
                  >
                    Authorize
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewINFT;