// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDC Mock Token
 * @dev Mock USDC implementation for hackathon micropayments
 * @notice For development/hackathon use only - not for production
 */
contract USDC is ERC20, Ownable {
    uint8 private _decimals = 6; // USDC has 6 decimals
    
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint initial supply for testing (1M USDC)
        _mint(msg.sender, 1000000 * 10**6);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @notice Mint USDC tokens (owner only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in USDC units with 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Faucet function for hackathon testing
     * @dev Anyone can mint up to 1000 USDC for testing
     */
    function faucet() external {
        require(balanceOf(msg.sender) < 1000 * 10**6, "Already have enough USDC");
        _mint(msg.sender, 1000 * 10**6); // 1000 USDC
    }
}