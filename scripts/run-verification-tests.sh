#!/bin/bash

# =============================================================================
# CHIMERA-DEVMATCH VERIFICATION TEST RUNNER
# Senior Web3 QA Engineer Implementation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_header() { echo -e "${BOLD}${BLUE}$1${NC}"; }

# Usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --cleanup          Run cleanup verification tests only"
    echo "  --rollback         Run rollback verification tests only"
    echo "  --all              Run all verification tests (default)"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 --cleanup       # Run cleanup verification only"
    echo "  $0 --rollback      # Run rollback verification only"
}

# Make scripts executable
setup_permissions() {
    local scripts=("cleanup-verification.sh" "rollback-verification.sh")
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            chmod +x "$script"
            log_info "Made $script executable"
        else
            log_error "Script not found: $script"
            exit 1
        fi
    done
}

# Run cleanup verification tests
run_cleanup_tests() {
    log_header "🧹 RUNNING CLEANUP VERIFICATION TESTS"
    log_header "====================================="
    
    if [[ -f "cleanup-verification.sh" ]]; then
        if ./cleanup-verification.sh; then
            log_success "Cleanup verification tests passed"
            return 0
        else
            log_error "Cleanup verification tests failed"
            return 1
        fi
    else
        log_error "cleanup-verification.sh not found"
        return 1
    fi
}

# Run rollback verification tests  
run_rollback_tests() {
    log_header "🔄 RUNNING ROLLBACK VERIFICATION TESTS"
    log_header "======================================"
    
    if [[ -f "rollback-verification.sh" ]]; then
        if ./rollback-verification.sh; then
            log_success "Rollback verification tests passed"
            return 0
        else
            log_error "Rollback verification tests failed"
            return 1
        fi
    else
        log_error "rollback-verification.sh not found"
        return 1
    fi
}

# Main execution function
main() {
    local run_cleanup=false
    local run_rollback=false
    local run_all=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cleanup)
                run_cleanup=true
                run_all=false
                shift
                ;;
            --rollback)
                run_rollback=true
                run_all=false
                shift
                ;;
            --all)
                run_all=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check if we're in the right directory
    if [[ ! -f "CLAUDE.md" ]] && [[ ! -f "package.json" ]]; then
        log_error "Please run this script from the chimera-devmatch root directory"
        exit 1
    fi
    
    log_header "🚀 CHIMERA-DEVMATCH VERIFICATION TEST SUITE"
    log_header "==========================================="
    log_info "Starting verification tests for project cleanup..."
    echo
    
    # Setup script permissions
    setup_permissions
    
    local cleanup_result=0
    local rollback_result=0
    
    # Run requested tests
    if [[ "$run_all" == true ]] || [[ "$run_cleanup" == true ]]; then
        run_cleanup_tests
        cleanup_result=$?
        echo
    fi
    
    if [[ "$run_all" == true ]] || [[ "$run_rollback" == true ]]; then
        run_rollback_tests
        rollback_result=$?
        echo
    fi
    
    # Final report
    log_header "📊 FINAL VERIFICATION REPORT"
    log_header "============================"
    
    if [[ "$run_all" == true ]]; then
        if [[ $cleanup_result -eq 0 ]] && [[ $rollback_result -eq 0 ]]; then
            log_success "🎉 ALL VERIFICATION TESTS PASSED!"
            log_success "Project is ready for safe cleanup operations"
            echo
            log_info "Next steps:"
            log_info "1. Execute cleanup plan if all tests passed"
            log_info "2. Monitor cleanup progress with these tests"
            log_info "3. Use rollback procedures if needed"
        else
            log_error "❌ VERIFICATION TESTS FAILED"
            if [[ $cleanup_result -ne 0 ]]; then
                log_error "  - Cleanup verification failed"
            fi
            if [[ $rollback_result -ne 0 ]]; then
                log_error "  - Rollback verification failed"
            fi
            echo
            log_info "Please address the issues above before proceeding with cleanup"
            exit 1
        fi
    elif [[ "$run_cleanup" == true ]]; then
        if [[ $cleanup_result -eq 0 ]]; then
            log_success "✅ CLEANUP VERIFICATION PASSED"
        else
            log_error "❌ CLEANUP VERIFICATION FAILED"
            exit 1
        fi
    elif [[ "$run_rollback" == true ]]; then
        if [[ $rollback_result -eq 0 ]]; then
            log_success "✅ ROLLBACK VERIFICATION PASSED"
        else
            log_error "❌ ROLLBACK VERIFICATION FAILED"
            exit 1
        fi
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi