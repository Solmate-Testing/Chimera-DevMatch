// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDataVerifier {
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

    function verifyOwnership(bytes calldata _proof)
        external view returns (OwnershipProofOutput memory);

    function verifyTransferValidity(bytes calldata _proof)
        external view returns (TransferValidityProofOutput memory);
}