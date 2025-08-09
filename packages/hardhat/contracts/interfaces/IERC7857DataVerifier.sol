// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC7857DataVerifier
 * @dev Interface for ERC-7857 data verification
 */
interface IERC7857DataVerifier {
    struct OwnershipProofOutput {
        bytes32[] dataHashes;
        bool isValid;
    }

    struct TransferValidityProofOutput {
        bytes32[] oldDataHashes;
        bytes32[] newDataHashes;
        bytes pubKey;
        bytes sealedKey;
        bool isValid;
    }

    function verifyOwnership(bytes calldata _proof) external returns (OwnershipProofOutput memory);
    function verifyTransferValidity(bytes calldata _proof) external returns (TransferValidityProofOutput memory);
}