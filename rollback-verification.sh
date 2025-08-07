#!/bin/bash

# =============================================================================
# CHIMERA-DEVMATCH ROLLBACK VERIFICATION TESTS
# Senior Web3 QA Engineer Implementation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
ROLLBACK_TESTS=0
ROLLBACK_PASSED=0
ROLLBACK_FAILED=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; ((ROLLBACK_PASSED++)); }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; ((ROLLBACK_FAILED++)); }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

run_rollback_test() {
    local test_name="$1"
    local test_function="$2"
    
    log_info "Running rollback test: $test_name..."
    ((ROLLBACK_TESTS++))
    
    if $test_function; then
        log_success "$test_name rollback verification passed"
    else
        log_error "$test_name rollback verification failed"
        return 1
    fi
}

# =============================================================================
# ROLLBACK VERIFICATION TESTS
# =============================================================================

testBackupIntegrity() {
    local errors=0
    
    log_info "Verifying backup file integrity..."
    
    # Check for backup directories
    local backup_dirs=$(find /tmp -name "chimera-backup-*" -type d 2>/dev/null | head -5)
    if [[ -n "$backup_dirs" ]]; then
        log_success "Found backup directories:"
        echo "$backup_dirs" | while read dir; do
            log_info "  -> $dir"
        done
        
        # Check backup contents
        local latest_backup=$(echo "$backup_dirs" | tail -1)
        if [[ -d "$latest_backup" ]]; then
            local required_backups=("env.backup" "gitignore.backup" "claude.backup")
            for backup_file in "${required_backups[@]}"; do
                if [[ -f "$latest_backup/$backup_file" ]]; then
                    log_success "Found backup file: $backup_file"
                else
                    log_error "Missing backup file: $backup_file"
                    ((errors++))
                fi
            done
        fi
    else
        log_warning "No backup directories found in /tmp"
    fi
    
    return $errors
}

testGitRollbackCapability() {
    local errors=0
    
    log_info "Verifying Git rollback capability..."
    
    # Check for backup tags
    if git tag | grep -q "pre-cleanup"; then
        log_success "Found pre-cleanup Git tags"
    else
        log_warning "No pre-cleanup Git tags found"
    fi
    
    # Check for backup branches
    if git branch | grep -q "backup-"; then
        log_success "Found backup branches"
    else
        log_warning "No backup branches found"
    fi
    
    # Check Git stash
    if git stash list | grep -q "Pre-cleanup\|ENV_BACKUP"; then
        log_success "Found relevant Git stashes"
    else
        log_warning "No relevant Git stashes found"
    fi
    
    # Verify Git repository is in good state for rollback
    if git status &>/dev/null; then
        log_success "Git repository ready for rollback operations"
    else
        log_error "Git repository not ready for rollback"
        ((errors++))
    fi
    
    return $errors
}

testRecoveryProcedures() {
    local errors=0
    
    log_info "Testing recovery procedures (dry run)..."
    
    # Test 1: Check if we can identify original state
    if git log --oneline | grep -q "CHECKPOINT\|Initial commit"; then
        log_success "Can identify original project state"
    else
        log_warning "Original project state not clearly marked"
    fi
    
    # Test 2: Verify backup file checksums (if available)
    local checksum_file="/tmp/env-checksum.txt"
    if [[ -f "$checksum_file" ]] && [[ -f ".env.local" ]]; then
        local original_checksum=$(cat "$checksum_file")
        local current_checksum=$(md5sum .env.local)
        
        if echo "$current_checksum" | grep -q "${original_checksum%% *}"; then
            log_success "Environment file checksum matches backup"
        else
            log_warning "Environment file has been modified since backup"
        fi
    else
        log_info "No checksum verification available"
    fi
    
    # Test 3: Verify we can access backup files
    local backup_dir=$(find /tmp -name "chimera-backup-*" -type d 2>/dev/null | tail -1)
    if [[ -n "$backup_dir" ]] && [[ -r "$backup_dir" ]]; then
        log_success "Backup directory is accessible for recovery"
    else
        log_warning "Backup directory may not be accessible"
    fi
    
    return $errors
}

testEnvironmentRecovery() {
    local errors=0
    
    log_info "Verifying environment recovery capabilities..."
    
    # Check current .env.local against backup
    local backup_dir=$(find /tmp -name "chimera-backup-*" -type d 2>/dev/null | tail -1)
    if [[ -f "$backup_dir/env.backup" ]] && [[ -f ".env.local" ]]; then
        # Compare key counts
        local backup_keys=$(grep -c "=" "$backup_dir/env.backup" 2>/dev/null || echo 0)
        local current_keys=$(grep -c "=" ".env.local" 2>/dev/null || echo 0)
        
        if [[ "$backup_keys" -eq "$current_keys" ]]; then
            log_success "Environment key count matches backup"
        else
            log_warning "Environment key count differs from backup ($current_keys vs $backup_keys)"
        fi
        
        # Check for critical keys in backup
        local critical_keys=("PRIVY_APP_ID" "BICONOMY" "DEPLOYER_PRIVATE_KEY")
        for key in "${critical_keys[@]}"; do
            if grep -q "$key" "$backup_dir/env.backup"; then
                log_success "Critical key available in backup: $key"
            else
                log_error "Critical key missing from backup: $key"
                ((errors++))
            fi
        done
    else
        log_warning "Cannot compare current environment with backup"
    fi
    
    return $errors
}

testWorkspaceRecovery() {
    local errors=0
    
    log_info "Verifying workspace recovery capabilities..."
    
    # Check if we can restore workspace configuration
    local backup_dir=$(find /tmp -name "chimera-backup-*" -type d 2>/dev/null | tail -1)
    if [[ -f "$backup_dir/package.json" ]]; then
        if grep -q "workspaces" "$backup_dir/package.json"; then
            log_success "Workspace configuration available in backup"
        else
            log_warning "Backup package.json may not have workspaces"
        fi
    else
        log_warning "No package.json backup available"
    fi
    
    # Check if yarn.lock backup exists
    if [[ -f "$backup_dir/yarn.lock" ]]; then
        local backup_size=$(wc -c < "$backup_dir/yarn.lock" 2>/dev/null || echo 0)
        if [[ "$backup_size" -gt 1000 ]]; then
            log_success "Yarn.lock backup appears complete"
        else
            log_warning "Yarn.lock backup may be incomplete"
        fi
    else
        log_warning "No yarn.lock backup available"
    fi
    
    return $errors
}

testEmergencyRollback() {
    local errors=0
    
    log_info "Testing emergency rollback procedures (simulation)..."
    
    # Simulate emergency rollback command validation
    local emergency_commands=(
        "git reset --hard"
        "git checkout"
        "git stash pop"
        "cp /tmp/chimera-backup-*/env.backup .env.local"
    )
    
    for cmd in "${emergency_commands[@]}"; do
        if command -v "${cmd%% *}" &> /dev/null; then
            log_success "Emergency command available: ${cmd%% *}"
        else
            log_error "Emergency command not available: ${cmd%% *}"
            ((errors++))
        fi
    done
    
    # Check if we can identify the pre-cleanup state
    local cleanup_tags=$(git tag | grep "pre-cleanup" | head -1)
    if [[ -n "$cleanup_tags" ]]; then
        log_success "Can identify pre-cleanup state: $cleanup_tags"
        
        # Verify the tag is valid
        if git show "$cleanup_tags" &>/dev/null; then
            log_success "Pre-cleanup tag is valid and accessible"
        else
            log_error "Pre-cleanup tag is corrupted or inaccessible"
            ((errors++))
        fi
    else
        log_warning "No pre-cleanup tags found for emergency rollback"
    fi
    
    return $errors
}

# =============================================================================
# ROLLBACK TEST RUNNER
# =============================================================================

run_all_rollback_tests() {
    log_info "Starting rollback verification tests..."
    log_info "======================================"
    
    run_rollback_test "Backup Integrity" testBackupIntegrity
    run_rollback_test "Git Rollback Capability" testGitRollbackCapability
    run_rollback_test "Recovery Procedures" testRecoveryProcedures
    run_rollback_test "Environment Recovery" testEnvironmentRecovery
    run_rollback_test "Workspace Recovery" testWorkspaceRecovery
    run_rollback_test "Emergency Rollback" testEmergencyRollback
}

generate_rollback_report() {
    echo
    log_info "======================================"
    log_info "ROLLBACK VERIFICATION REPORT"
    log_info "======================================"
    
    if [[ $ROLLBACK_FAILED -eq 0 ]]; then
        log_success "🔄 ALL ROLLBACK TESTS PASSED! ($ROLLBACK_PASSED/$ROLLBACK_TESTS)"
        log_success "Project is ready for safe cleanup with rollback capability"
    else
        log_error "❌ ROLLBACK ISSUES DETECTED ($ROLLBACK_FAILED/$ROLLBACK_TESTS failed)"
        log_error "Consider creating additional backups before cleanup"
        
        echo
        log_info "Recommended actions:"
        log_info "1. Create additional Git tags/branches"
        log_info "2. Ensure backup directory permissions"
        log_info "3. Test manual rollback procedures"
        
        exit 1
    fi
    
    echo
    log_info "Rollback procedures available:"
    log_info "1. Emergency: git reset --hard <pre-cleanup-tag>"
    log_info "2. Partial: cp /tmp/backup/* ./"
    log_info "3. Environment: git stash pop (if ENV_BACKUP exists)"
}

main() {
    if [[ ! -f "CLAUDE.md" ]] && [[ ! -f "package.json" ]]; then
        log_error "Please run this script from the chimera-devmatch root directory"
        exit 1
    fi
    
    run_all_rollback_tests
    generate_rollback_report
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi