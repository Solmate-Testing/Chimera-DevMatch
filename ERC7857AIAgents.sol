// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataVerifier.sol";

contract ERC7857AIAgents {
    IDataVerifier public immutable verifier;

    struct AgentData {
        bytes32[] dataHashes;
        string[] dataDescriptions;
        address owner;
        address[] authorizedUsers;
        uint256 createdAt;
        bool isPublic;
    }

    mapping(uint256 => AgentData) private agents;
    mapping(uint256 => mapping(address => bool)) private authorizations;

    uint256 private _tokenIdCounter;

    // Events
    event Minted(
        uint256 indexed tokenId,
        address indexed creator,
        bytes32[] dataHashes,
        string[] dataDescriptions
    );

    event Updated(
        uint256 indexed tokenId,
        bytes32[] oldDataHashes,
        bytes32[] newDataHashes
    );

    event Transferred(
        uint256 tokenId,
        address indexed from,
        address indexed to
    );

    event Cloned(
        uint256 indexed tokenId,
        uint256 indexed newTokenId,
        address from,
        address to
    );

    event AuthorizedUsage(
        uint256 indexed tokenId,
        address indexed user
    );

    event PublishedSealedKey(
        address indexed to,
        uint256 indexed tokenId,
        bytes sealedKey
    );

    constructor(IDataVerifier _verifier) {
        verifier = _verifier;
    }

    function name() external pure returns (string memory) {
        return "ERC7857 AI Agents";
    }

    function symbol() external pure returns (string memory) {
        return "AI7857";
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(
            "https://api.chimera-devmatch.com/metadata/",
            toString(tokenId)
        ));
    }

    function mint(
        bytes[] calldata proofs,
        string[] calldata dataDescriptions
    ) external payable returns (uint256 tokenId) {
        require(proofs.length > 0, "No proofs provided");
        require(proofs.length == dataDescriptions.length, "Mismatched arrays");

        bytes32[] memory allDataHashes = new bytes32[](proofs.length);

        // Verify all ownership proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.OwnershipProofOutput memory output =
                verifier.verifyOwnership(proofs[i]);
            require(output.isValid, "Invalid ownership proof");
            require(output.dataHashes.length == 1, "Expected single hash");
            allDataHashes[i] = output.dataHashes[0];
        }

        tokenId = _tokenIdCounter++;

        agents[tokenId] = AgentData({
            dataHashes: allDataHashes,
            dataDescriptions: dataDescriptions,
            owner: msg.sender,
            authorizedUsers: new address[](0),
            createdAt: block.timestamp,
            isPublic: false
        });

        emit Minted(tokenId, msg.sender, allDataHashes, dataDescriptions);
    }

    function transfer(
        address to,
        uint256 tokenId,
        bytes[] calldata proofs
    ) external {
        require(_exists(tokenId), "Token does not exist");
        require(agents[tokenId].owner == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");

        AgentData storage agent = agents[tokenId];
        require(proofs.length == agent.dataHashes.length, "Mismatched proofs");

        bytes32[] memory newDataHashes = new bytes32[](proofs.length);

        // Verify all transfer validity proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.TransferValidityProofOutput memory output =
                verifier.verifyTransferValidity(proofs[i]);
            require(output.isValid, "Invalid transfer proof");

            // Verify old hash matches
            require(
                output.oldDataHashes.length == 1 &&
                output.oldDataHashes[0] == agent.dataHashes[i],
                "Hash mismatch"
            );
            require(output.newDataHashes.length == 1, "Expected single new hash");

            newDataHashes[i] = output.newDataHashes[0];

            // Publish sealed key for recipient
            emit PublishedSealedKey(to, tokenId, output.sealedKey);
        }

        // Update agent data
        emit Updated(tokenId, agent.dataHashes, newDataHashes);
        agent.dataHashes = newDataHashes;
        agent.owner = to;
        agent.authorizedUsers = new address[](0); // Clear authorizations

        emit Transferred(tokenId, msg.sender, to);
    }

    function clone(
        address to,
        uint256 tokenId,
        bytes[] calldata proofs
    ) external payable returns (uint256 newTokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(agents[tokenId].owner == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");

        AgentData storage sourceAgent = agents[tokenId];
        require(proofs.length == sourceAgent.dataHashes.length, "Mismatched proofs");

        bytes32[] memory newDataHashes = new bytes32[](proofs.length);

        // Verify all transfer validity proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.TransferValidityProofOutput memory output =
                verifier.verifyTransferValidity(proofs[i]);
            require(output.isValid, "Invalid clone proof");

            require(
                output.oldDataHashes.length == 1 &&
                output.oldDataHashes[0] == sourceAgent.dataHashes[i],
                "Hash mismatch"
            );
            require(output.newDataHashes.length == 1, "Expected single new hash");

            newDataHashes[i] = output.newDataHashes[0];

            emit PublishedSealedKey(to, tokenId, output.sealedKey);
        }

        newTokenId = _tokenIdCounter++;

        agents[newTokenId] = AgentData({
            dataHashes: newDataHashes,
            dataDescriptions: sourceAgent.dataDescriptions,
            owner: to,
            authorizedUsers: new address[](0),
            createdAt: block.timestamp,
            isPublic: sourceAgent.isPublic
        });

        emit Cloned(tokenId, newTokenId, msg.sender, to);
    }

    function authorizeUsage(uint256 tokenId, address user) external {
        require(_exists(tokenId), "Token does not exist");
        require(agents[tokenId].owner == msg.sender, "Not token owner");
        require(user != address(0), "Invalid user");
        require(!authorizations[tokenId][user], "Already authorized");

        authorizations[tokenId][user] = true;
        agents[tokenId].authorizedUsers.push(user);

        emit AuthorizedUsage(tokenId, user);
    }

    // View functions
    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return agents[tokenId].owner;
    }

    function dataHashesOf(uint256 tokenId) external view returns (bytes32[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return agents[tokenId].dataHashes;
    }

    function dataDescriptionsOf(uint256 tokenId) external view returns (string[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return agents[tokenId].dataDescriptions;
    }

    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return agents[tokenId].authorizedUsers;
    }

    function _exists(uint256 tokenId) private view returns (bool) {
        return agents[tokenId].owner != address(0);
    }

    function toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}