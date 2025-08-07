#!/bin/bash

# =============================================================================
# CHIMERA-DEVMATCH CLEANUP VERIFICATION TESTS
# Senior Web3 QA Engineer Implementation
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    log_info "Running $test_name..."
    ((TOTAL_TESTS++))
    
    if $test_function; then
        log_success "$test_name completed successfully"
    else
        log_error "$test_name failed"
        return 1
    fi
}

# =============================================================================
# TEST 1: PROJECT STRUCTURE VERIFICATION
# =============================================================================

testProjectStructure() {
    local errors=0
    
    log_info "Verifying Scaffold-ETH 2 project structure..."
    
    # Test 1.1: Root directory structure
    if [[ ! -f "package.json" ]]; then
        log_error "Missing root package.json"
        ((errors++))
    fi
    
    if [[ ! -f "yarn.lock" ]]; then
        log_error "Missing yarn.lock file"
        ((errors++))
    fi
    
    # Test 1.2: Packages directory exists
    if [[ ! -d "packages" ]]; then
        log_error "Missing packages directory"
        ((errors++))
    fi
    
    # Test 1.3: Required package subdirectories
    local required_packages=("hardhat" "nextjs")
    for package in "${required_packages[@]}"; do
        if [[ ! -d "packages/$package" ]]; then
            log_error "Missing packages/$package directory"
            ((errors++))
        else
            log_success "Found packages/$package directory"
        fi
    done
    
    # Test 1.4: Hardhat package structure
    if [[ -d "packages/hardhat" ]]; then
        local hardhat_files=("package.json" "hardhat.config.ts" "contracts" "deploy")
        for file in "${hardhat_files[@]}"; do
            if [[ ! -e "packages/hardhat/$file" ]]; then
                log_error "Missing packages/hardhat/$file"
                ((errors++))
            else
                log_success "Found packages/hardhat/$file"
            fi
        done
        
        # Check for Marketplace.sol contract
        if [[ -f "packages/hardhat/contracts/Marketplace.sol" ]]; then
            log_success "Found Marketplace.sol contract"
        else
            log_warning "Marketplace.sol contract not found (may be added later)"
        fi
    fi
    
    # Test 1.5: NextJS package structure  
    if [[ -d "packages/nextjs" ]]; then
        local nextjs_files=("package.json" "next.config.ts" "app" "components")
        for file in "${nextjs_files[@]}"; do
            if [[ ! -e "packages/nextjs/$file" ]]; then
                log_error "Missing packages/nextjs/$file"
                ((errors++))
            else
                log_success "Found packages/nextjs/$file"
            fi
        done
        
        # Check for custom components
        if [[ -f "packages/nextjs/components/Marketplace.tsx" ]]; then
            log_success "Found Marketplace.tsx component"
        else
            log_warning "Marketplace.tsx component not found (may be added later)"
        fi
    fi
    
    # Test 1.6: Subgraph package (if exists)
    if [[ -d "packages/subgraph" ]]; then
        local subgraph_files=("schema.graphql" "src/mapping.ts")
        for file in "${subgraph_files[@]}"; do
            if [[ ! -e "packages/subgraph/$file" ]]; then
                log_error "Missing packages/subgraph/$file"
                ((errors++))
            else
                log_success "Found packages/subgraph/$file"
            fi
        done
    fi
    
    # Test 1.7: No leftover messy files
    local unwanted_files=("TerminalOutput.md" "hackathon_setup_guide.md")
    for file in "${unwanted_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_error "Unwanted file still exists: $file"
            ((errors++))
        else
            log_success "Unwanted file removed: $file"
        fi
    done
    
    return $errors
}

# =============================================================================
# TEST 2: YARN CONFIGURATION VERIFICATION
# =============================================================================

testYarnConfiguration() {
    local errors=0
    
    log_info "Verifying Yarn configuration..."
    
    # Test 2.1: Yarn version check
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn is not installed or not in PATH"
        ((errors++))
        return $errors
    fi
    
    local yarn_version=$(yarn --version 2>/dev/null)
    log_info "Detected Yarn version: $yarn_version"
    
    # Test 2.2: Package.json workspace configuration
    if [[ -f "package.json" ]]; then
        if grep -q '"workspaces"' package.json; then
            log_success "Workspaces configuration found in package.json"
        else
            log_error "Missing workspaces configuration in package.json"
            ((errors++))
        fi
        
        # Check specific workspaces
        if grep -q '"packages/hardhat"' package.json; then
            log_success "Hardhat workspace configured"
        else
            log_error "Missing hardhat workspace in package.json"
            ((errors++))
        fi
        
        if grep -q '"packages/nextjs"' package.json; then
            log_success "NextJS workspace configured"
        else
            log_error "Missing nextjs workspace in package.json"
            ((errors++))
        fi
        
        # Check package manager specification
        if grep -q '"packageManager".*yarn' package.json; then
            log_success "Yarn specified as package manager"
        else
            log_warning "Package manager not specified in package.json"
        fi
    else
        log_error "Missing package.json file"
        ((errors++))
        return $errors
    fi
    
    # Test 2.3: Yarn.lock integrity
    if [[ -f "yarn.lock" ]]; then
        if [[ -s "yarn.lock" ]]; then
            log_success "Yarn.lock file exists and is not empty"
        else
            log_error "Yarn.lock file is empty"
            ((errors++))
        fi
        
        # Check for version in yarn.lock
        if grep -q "__metadata:" yarn.lock; then
            log_success "Yarn.lock has proper metadata structure"
        else
            log_error "Yarn.lock appears to be corrupted"
            ((errors++))
        fi
    else
        log_error "Missing yarn.lock file"
        ((errors++))
    fi
    
    # Test 2.4: Node modules structure
    if [[ -d "node_modules" ]]; then
        log_success "Root node_modules directory exists"
    else
        log_warning "Root node_modules directory missing (run 'yarn install')"
    fi
    
    # Test 2.5: No npm artifacts
    if [[ -f "package-lock.json" ]]; then
        log_error "Found package-lock.json (npm artifact - should be removed)"
        ((errors++))
    else
        log_success "No npm artifacts found"
    fi
    
    # Test 2.6: Workspace commands validation
    if yarn workspaces list --json &>/dev/null; then
        log_success "Yarn workspaces command working"
        
        # List actual workspaces
        local workspaces=$(yarn workspaces list --json 2>/dev/null | jq -r '.name' 2>/dev/null || echo "")
        if [[ -n "$workspaces" ]]; then
            log_info "Detected workspaces: $workspaces"
        fi
    else
        log_error "Yarn workspaces command failed"
        ((errors++))
    fi
    
    return $errors
}

# =============================================================================
# TEST 3: ENVIRONMENT PRESERVATION VERIFICATION
# =============================================================================

testEnvPreservation() {
    local errors=0
    
    log_info "Verifying environment variable preservation..."
    
    # Test 3.1: Root .env.local preservation
    if [[ -f ".env.local" ]]; then
        log_success "Root .env.local file preserved"
        
        # Test 3.2: Critical API keys present
        local required_keys=(
            "NEXT_PUBLIC_PRIVY_APP_ID"
            "NEXT_PUBLIC_BICONOMY_BUNDLER_URL"
            "NEXT_PUBLIC_BICONOMY_PAYMASTER_URL"
            "DEPLOYER_PRIVATE_KEY"
            "OASIS_SAPPHIRE_RPC"
            "ETHERSCAN_API_KEY"
        )
        
        for key in "${required_keys[@]}"; do
            if grep -q "^${key}=" .env.local; then
                log_success "API key preserved: $key"
            else
                log_error "Missing API key: $key"
                ((errors++))
            fi
        done
        
        # Test 3.3: No empty values
        if grep -q "=your_" .env.local; then
            log_warning "Found placeholder values (your_*)"
        fi
        
        if grep -q "=0x\.\.\." .env.local; then
            log_warning "Found placeholder contract addresses"
        fi
        
    else
        log_error "Root .env.local file missing"
        ((errors++))
    fi
    
    # Test 3.4: Package-specific environment files
    if [[ -f "packages/nextjs/.env.local" ]]; then
        log_success "NextJS .env.local exists"
        
        # Should contain NEXT_PUBLIC_ keys only
        if grep -q "NEXT_PUBLIC_" packages/nextjs/.env.local; then
            log_success "NextJS env contains frontend keys"
        else
            log_warning "NextJS env missing frontend keys"
        fi
        
        # Should NOT contain backend keys
        if grep -q "DEPLOYER_PRIVATE_KEY" packages/nextjs/.env.local; then
            log_error "NextJS env contains backend keys (security risk)"
            ((errors++))
        fi
    fi
    
    if [[ -f "packages/hardhat/.env" ]]; then
        log_success "Hardhat .env exists"
        
        # Should contain backend keys
        if grep -q "DEPLOYER_PRIVATE_KEY\|RPC\|API_KEY" packages/hardhat/.env; then
            log_success "Hardhat env contains backend keys"
        else
            log_warning "Hardhat env missing backend keys"
        fi
        
        # Should NOT contain NEXT_PUBLIC_ keys
        if grep -q "NEXT_PUBLIC_" packages/hardhat/.env; then
            log_warning "Hardhat env contains frontend keys (unnecessary)"
        fi
    fi
    
    # Test 3.5: Environment file permissions (security check)
    for env_file in .env.local packages/nextjs/.env.local packages/hardhat/.env; do
        if [[ -f "$env_file" ]]; then
            local perms=$(stat -c %a "$env_file" 2>/dev/null || stat -f %A "$env_file" 2>/dev/null)
            if [[ "$perms" == "600" ]] || [[ "$perms" == "644" ]]; then
                log_success "Environment file has safe permissions: $env_file ($perms)"
            else
                log_warning "Environment file permissions should be 600: $env_file ($perms)"
            fi
        fi
    done
    
    return $errors
}

# =============================================================================
# TEST 4: GITIGNORE PRESERVATION VERIFICATION
# =============================================================================

testGitIgnorePreservation() {
    local errors=0
    
    log_info "Verifying .gitignore preservation..."
    
    # Test 4.1: .gitignore exists
    if [[ -f ".gitignore" ]]; then
        log_success ".gitignore file preserved"
    else
        log_error ".gitignore file missing"
        ((errors++))
        return $errors
    fi
    
    # Test 4.2: Essential ignore patterns
    local required_patterns=(
        "node_modules"
        "\.yarn/\*"
        "\.env"
        "\.DS_Store"
    )
    
    for pattern in "${required_patterns[@]}"; do
        if grep -q "$pattern" .gitignore; then
            log_success "Found ignore pattern: $pattern"
        else
            log_error "Missing ignore pattern: $pattern"
            ((errors++))
        fi
    done
    
    # Test 4.3: Yarn-specific patterns
    local yarn_patterns=(
        "\.yarn/cache"
        "\.yarn/unplugged"
        "\.yarn/build-state\.yml"
        "\.yarn/install-state\.gz"
    )
    
    for pattern in "${yarn_patterns[@]}"; do
        if grep -q "$pattern" .gitignore || grep -q "\.yarn/\*" .gitignore; then
            log_success "Yarn ignore pattern covered: $pattern"
        else
            log_warning "Consider adding Yarn pattern: $pattern"
        fi
    done
    
    # Test 4.4: Environment file patterns
    local env_patterns=(
        "\.env\.local"
        "\.env$"
        "packages/\*/\.env"
    )
    
    for pattern in "${env_patterns[@]}"; do
        if grep -q "$pattern" .gitignore; then
            log_success "Environment ignore pattern: $pattern"
        else
            log_warning "Consider adding env pattern: $pattern"
        fi
    done
    
    # Test 4.5: Development artifacts
    local dev_patterns=(
        "TerminalOutput\.md"
        "hackathon_setup_guide\.md"
        "claude_requirements\.md"
    )
    
    for pattern in "${dev_patterns[@]}"; do
        if grep -q "$pattern" .gitignore; then
            log_success "Development artifact ignored: $pattern"
        else
            log_info "Development artifact pattern not found: $pattern"
        fi
    done
    
    # Test 4.6: .gitignore syntax validation
    if git check-ignore --stdin < /dev/null &>/dev/null; then
        log_success ".gitignore syntax is valid"
    else
        log_warning ".gitignore syntax might have issues"
    fi
    
    return $errors
}

# =============================================================================
# ADDITIONAL VERIFICATION TESTS
# =============================================================================

testGitIntegrity() {
    local errors=0
    
    log_info "Verifying Git repository integrity..."
    
    # Test Git repository status
    if git status &>/dev/null; then
        log_success "Git repository is valid"
    else
        log_error "Git repository is corrupted or not initialized"
        ((errors++))
        return $errors
    fi
    
    # Check for uncommitted changes
    if [[ -n "$(git status --porcelain)" ]]; then
        log_info "Found uncommitted changes (expected during cleanup)"
        git status --porcelain | head -5
    else
        log_success "Working directory is clean"
    fi
    
    # Check for backup tags
    if git tag | grep -q "pre-cleanup\|safe-state"; then
        log_success "Found backup tags"
    else
        log_warning "No backup tags found (recommended for safety)"
    fi
    
    return $errors
}

testScaffoldEthCompliance() {
    local errors=0
    
    log_info "Verifying Scaffold-ETH 2 compliance..."
    
    # Check for scaffold.config.ts (created by extensions)
    if [[ -f "scaffold.config.ts" ]]; then
        log_success "Found scaffold.config.ts"
    else
        log_info "scaffold.config.ts not found (will be created by extensions)"
    fi
    
    # Check workspace naming convention
    if [[ -f "packages/hardhat/package.json" ]]; then
        if grep -q '"name".*@se-2/hardhat' packages/hardhat/package.json; then
            log_success "Hardhat package uses Scaffold-ETH naming"
        else
            log_info "Hardhat package may use custom naming"
        fi
    fi
    
    if [[ -f "packages/nextjs/package.json" ]]; then
        if grep -q '"name".*@se-2/nextjs' packages/nextjs/package.json; then
            log_success "NextJS package uses Scaffold-ETH naming"
        else
            log_info "NextJS package may use custom naming"
        fi
    fi
    
    # Check for required Scaffold-ETH dependencies (if packages exist)
    local se2_deps=("@rainbow-me/rainbowkit" "wagmi" "viem")
    if [[ -f "packages/nextjs/package.json" ]]; then
        for dep in "${se2_deps[@]}"; do
            if grep -q "\"$dep\"" packages/nextjs/package.json; then
                log_success "Found Scaffold-ETH dependency: $dep"
            else
                log_info "Scaffold-ETH dependency not yet installed: $dep"
            fi
        done
    fi
    
    return $errors
}

# =============================================================================
# TEST RUNNER AND REPORTING
# =============================================================================

run_all_tests() {
    log_info "Starting Chimera-DevMatch cleanup verification tests..."
    log_info "=========================================================="
    
    # Core verification tests
    run_test "Project Structure Verification" testProjectStructure
    run_test "Yarn Configuration Verification" testYarnConfiguration  
    run_test "Environment Preservation Verification" testEnvPreservation
    run_test "GitIgnore Preservation Verification" testGitIgnorePreservation
    
    # Additional verification tests
    run_test "Git Integrity Verification" testGitIntegrity
    run_test "Scaffold-ETH Compliance Verification" testScaffoldEthCompliance
}

generate_report() {
    echo
    log_info "=========================================================="
    log_info "CLEANUP VERIFICATION REPORT"
    log_info "=========================================================="
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        log_success "🎉 ALL TESTS PASSED! ($PASSED_TESTS/$TOTAL_TESTS)"
        log_success "Project cleanup verification successful!"
        log_info "Ready for Scaffold-ETH 2 extension installation."
    else
        log_error "❌ SOME TESTS FAILED ($FAILED_TESTS/$TOTAL_TESTS failed)"
        log_error "Please address the issues above before proceeding."
        
        if [[ $PASSED_TESTS -gt 0 ]]; then
            log_info "✅ Tests passed: $PASSED_TESTS/$TOTAL_TESTS"
        fi
        
        exit 1
    fi
    
    echo
    log_info "Next steps:"
    log_info "1. If all tests passed, proceed with extension installation"
    log_info "2. If tests failed, fix issues and re-run verification"
    log_info "3. Run 'yarn install' if dependencies are missing"
    log_info "4. Check environment variables if API key tests failed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    # Check if we're in the right directory
    if [[ ! -f "CLAUDE.md" ]] && [[ ! -f "package.json" ]]; then
        log_error "Please run this script from the chimera-devmatch root directory"
        exit 1
    fi
    
    # Run all verification tests
    run_all_tests
    
    # Generate final report
    generate_report
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi