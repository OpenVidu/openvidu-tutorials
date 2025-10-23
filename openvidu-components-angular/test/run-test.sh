#!/bin/bash

set -o pipefail

# Configuration parameters (can be overridden with environment variables)
PORT=${PORT:-5080}
TIMEOUT=${TIMEOUT:-60000}
MAX_RETRIES=${MAX_RETRIES:-15}      # Number of attempts to check if the app is ready
RETRY_INTERVAL=${RETRY_INTERVAL:-2} # Seconds between retries
PARALLEL=${PARALLEL:-false}
MAX_PARALLEL=${MAX_PARALLEL:-2}
SKIP_INSTALL=${SKIP_INSTALL:-false}
CLEAN_NODE_MODULES=${CLEAN_NODE_MODULES:-true}
OPENVIDU_COMPONENTS_ANGULAR_VERSION=${OPENVIDU_COMPONENTS_ANGULAR_VERSION:-latest}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

TUTORIALS=(
  '../openvidu-additional-panels'
  '../openvidu-admin-dashboard'
  '../openvidu-custom-activities-panel'
  '../openvidu-custom-chat-panel'
  '../openvidu-custom-layout'
  '../openvidu-custom-panels'
  '../openvidu-custom-participant-panel-item'
  '../openvidu-custom-participant-panel-item-elements'
  '../openvidu-custom-participants-panel'
  '../openvidu-custom-stream'
  '../openvidu-custom-toolbar'
  '../openvidu-custom-ui'
  '../openvidu-custom-lang'
  '../openvidu-toggle-hand'
  '../openvidu-toolbar-buttons'
  '../openvidu-toolbar-panel-buttons'
)

# Initialize counters for successful and failed tests
SUCCESS=0
FAILURE=0
TOTAL=${#TUTORIALS[@]}
START_TIME=$(date +%s)

# Usage function
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -p, --parallel         Run tests in parallel (default: $PARALLEL)"
  echo "  -j, --jobs NUMBER      Maximum number of parallel jobs (default: $MAX_PARALLEL)"
  echo "  --port PORT            Port to use for the application (default: $PORT)"
  echo "  --timeout MILLISECONDS Timeout for waiting on application start (default: $TIMEOUT)"
  echo "  --retry-count NUMBER   Number of retries to check if app is ready (default: $MAX_RETRIES)"
  echo "  --retry-interval SEC   Seconds between retries (default: $RETRY_INTERVAL)"
  echo "  --skip-install         Skip npm install (default: $SKIP_INSTALL)"
  echo "  --keep-node-modules    Keep node_modules directory (default: !$CLEAN_NODE_MODULES)"
  echo "  --openvidu-components-version VER Version of openvidu-components-angular to install (default: $OPENVIDU_COMPONENTS_ANGULAR_VERSION)"
  echo "  --skip TUTORIAL        Skip specific tutorial (can be used multiple times)"
  echo "  --only TUTORIAL        Run only specific tutorial (can be used multiple times)"
  echo "  -h, --help             Display this help message"
  exit 0
}

# Parse command line arguments
SKIP_TUTORIALS=()
ONLY_TUTORIALS=()

while [[ $# -gt 0 ]]; do
  case $1 in
  -p | --parallel)
    PARALLEL=true
    shift
    ;;
  -j | --jobs)
    MAX_PARALLEL=$2
    shift 2
    ;;
  --port)
    PORT=$2
    shift 2
    ;;
  --timeout)
    TIMEOUT=$2
    shift 2
    ;;
  --retry-count)
    MAX_RETRIES=$2
    shift 2
    ;;
  --retry-interval)
    RETRY_INTERVAL=$2
    shift 2
    ;;
  --skip-install)
    SKIP_INSTALL=true
    shift
    ;;
  --keep-node-modules)
    CLEAN_NODE_MODULES=false
    shift
    ;;
  --openvidu-components-version)
    OPENVIDU_COMPONENTS_ANGULAR_VERSION=$2
    shift 2
    ;;
  --skip)
    SKIP_TUTORIALS+=("$2")
    shift 2
    ;;
  --only)
    ONLY_TUTORIALS+=("$2")
    shift 2
    ;;
  -h | --help)
    usage
    ;;
  *)
    echo "Unknown option: $1"
    usage
    ;;
  esac
done

# Create a temporary directory to store test results
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"; jobs -p | xargs -r kill; wait' EXIT

# Function to check if the application is ready
check_app_ready() {
  local port=$1
  local log_file=$2
  local retries=$MAX_RETRIES
  local ready=false

  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Checking if application is ready on port $port (max $retries attempts)...${NC}" | tee -a "$log_file"

  while [ $retries -gt 0 ]; do
    if curl -s "http://localhost:$port" >/dev/null 2>&1; then
      ready=true
      break
    fi

    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Waiting for application to start (attempts left: $retries)...${NC}" | tee -a "$log_file"
    sleep $RETRY_INTERVAL
    retries=$((retries - 1))
  done

  if [ "$ready" = true ]; then
    echo -e "${GREEN}[$(date '+%H:%M:%S')] Application is ready on port $port${NC}" | tee -a "$log_file"
    return 0
  else
    echo -e "${RED}[$(date '+%H:%M:%S')] Application failed to start on port $port after multiple attempts${NC}" | tee -a "$log_file"
    return 1
  fi
}

# Function to run tests on a tutorial
run_test() {
  local tutorial=$1
  local tutorial_name=$(basename "$tutorial")
  local log_file="$TEMP_DIR/${tutorial_name}.log"
  local result_file="$TEMP_DIR/${tutorial_name}.result"
  local start_time=$(date +%s)

  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Starting test for $tutorial_name...${NC}" | tee -a "$log_file"

  # Skip if not in ONLY_TUTORIALS when specified
  if [ ${#ONLY_TUTORIALS[@]} -gt 0 ] && ! [[ " ${ONLY_TUTORIALS[@]} " =~ " $tutorial_name " ]]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Skipping $tutorial_name (not in --only list)${NC}" | tee -a "$log_file"
    echo "SKIPPED" >"$result_file"
    return
  fi

  # Skip if in SKIP_TUTORIALS
  if [[ " ${SKIP_TUTORIALS[@]} " =~ " $tutorial_name " ]]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Skipping $tutorial_name (in --skip list)${NC}" | tee -a "$log_file"
    echo "SKIPPED" >"$result_file"
    return
  fi

  # Check if directory exists
  if [ ! -d "$tutorial" ]; then
    echo -e "${RED}[$(date '+%H:%M:%S')] Directory $tutorial does not exist${NC}" | tee -a "$log_file"
    echo "SKIPPED" >"$result_file"
    return
  fi

  # Navigate to tutorial directory
  pushd "$tutorial" >/dev/null || {
    echo -e "${RED}[$(date '+%H:%M:%S')] Cannot enter directory $tutorial${NC}" | tee -a "$log_file"
    echo "FAILED" >"$result_file"
    return
  }

  # Clean and install
  if [ "$CLEAN_NODE_MODULES" = true ]; then
    echo -e "${BLUE}[$(date '+%H:%M:%S')] Cleaning node_modules for $tutorial_name...${NC}" | tee -a "$log_file"
    echo -e "${GRAY}" # Switch to gray for command output
    rm -rf node_modules 2>&1 | tee -a "$log_file"
    echo -e "${NC}" # Reset color
  fi

  if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Installing dependencies for $tutorial_name...${NC}" | tee -a "$log_file"
    echo -e "${GRAY}" # Switch to gray for command output

    # Check if OPENVIDU_COMPONENTS_ANGULAR_VERSION is a file path
    if [[ "$OPENVIDU_COMPONENTS_ANGULAR_VERSION" == file:* ]]; then
      # Extract the path after 'file:'
      PACKAGE_PATH="${OPENVIDU_COMPONENTS_ANGULAR_VERSION#file:}"
      echo -e "${YELLOW}Installing from local package: $PACKAGE_PATH${NC}" | tee -a "$log_file"
      npm install "$PACKAGE_PATH" 2>&1 | tee -a "$log_file" || {
        echo -e "${NC}${RED}[$(date '+%H:%M:%S')] Failed to install dependencies for $tutorial_name${NC}" | tee -a "$log_file"
        echo "FAILED" >"$result_file"
        popd >/dev/null
        return
      }
    else
      # Install from npm registry
      npm install openvidu-components-angular@${OPENVIDU_COMPONENTS_ANGULAR_VERSION} 2>&1 | tee -a "$log_file" || {
        echo -e "${NC}${RED}[$(date '+%H:%M:%S')] Failed to install dependencies for $tutorial_name${NC}" | tee -a "$log_file"
        echo "FAILED" >"$result_file"
        popd >/dev/null
        return
      }
    fi
    echo -e "${NC}" # Reset color
  fi

  # Check if port is in use
  local available_port=$(find_available_port)
  if [ "$available_port" != "$PORT" ]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Port $PORT is in use, using port $available_port instead${NC}" | tee -a "$log_file"
    PORT=$available_port
  fi

  # Start the application with timeout
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Starting application for $tutorial_name on port $PORT...${NC}" | tee -a "$log_file"
  echo -e "${GRAY}" # Switch to gray for command output
  PORT=$PORT npm run start 2>&1 | tee -a "$log_file" &
  APP_PID=$!
  echo -e "${NC}" # Reset color

  # Set timeout to kill the process if it takes too long to start
  (
    sleep 120 # Increased timeout
    if kill -0 $APP_PID 2>/dev/null; then
      echo -e "${RED}[$(date '+%H:%M:%S')] Timeout starting application for $tutorial_name${NC}" | tee -a "$log_file"
      kill -9 $APP_PID 2>/dev/null
    fi
  ) &
  TIMEOUT_PID=$!

  # Wait for app to start using our custom function
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Waiting for application to start...${NC}" | tee -a "$log_file"
  if check_app_ready "$PORT" "$log_file"; then
    # Kill the timeout process
    kill $TIMEOUT_PID 2>/dev/null

    # Run the test
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Running test for $tutorial_name...${NC}" | tee -a "$log_file"
    echo -e "${GRAY}" # Switch to gray for command output
    if node ../test/test.js "$tutorial" "$PORT" 2>&1 | tee -a "$log_file"; then
      echo -e "${NC}${GREEN}[$(date '+%H:%M:%S')] Test passed for $tutorial_name${NC}" | tee -a "$log_file"
      echo "SUCCESS" >"$result_file"
    else
      echo -e "${NC}${RED}[$(date '+%H:%M:%S')] ERROR!! Test failed for $tutorial_name${NC}" | tee -a "$log_file"
      echo "FAILED" >"$result_file"
    fi
    echo -e "${NC}" # Reset color
  else
    echo -e "${RED}[$(date '+%H:%M:%S')] Application failed to start for $tutorial_name${NC}" | tee -a "$log_file"
    echo "FAILED" >"$result_file"
    kill $TIMEOUT_PID 2>/dev/null
  fi

  # Stop the application
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Stopping application for $tutorial_name...${NC}" | tee -a "$log_file"
  if kill -0 $APP_PID 2>/dev/null; then
    kill -15 $APP_PID 2>/dev/null

    # Wait for process to end gracefully with timeout
    local stop_timeout=10
    local stop_count=0
    while kill -0 $APP_PID 2>/dev/null && [ $stop_count -lt $stop_timeout ]; do
      echo -e "${YELLOW}[$(date '+%H:%M:%S')] Waiting for application to stop (${stop_count}/${stop_timeout})...${NC}" | tee -a "$log_file"
      sleep 1
      ((stop_count++))
    done

    # If process is still running after timeout, force kill
    if kill -0 $APP_PID 2>/dev/null; then
      echo -e "${RED}[$(date '+%H:%M:%S')] Application did not stop gracefully, forcing termination...${NC}" | tee -a "$log_file"
      kill -9 $APP_PID 2>/dev/null
    else
      echo -e "${GREEN}[$(date '+%H:%M:%S')] Application stopped successfully${NC}" | tee -a "$log_file"
    fi
  fi

  # Kill any remaining Angular processes for this port to be extra safe
  local ng_pids=$(ps aux | grep "ng.*$PORT" | grep -v grep | awk '{print $2}')
  if [ -n "$ng_pids" ]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Cleaning up additional Angular processes...${NC}" | tee -a "$log_file"
    echo $ng_pids | xargs -r kill -9 2>/dev/null || true
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] Test for $tutorial_name completed in ${duration}s${NC}" | tee -a "$log_file"

  popd >/dev/null
}

# Function to find an available port
find_available_port() {
  local port=$PORT
  while lsof -i :"$port" >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "$port"
}

# Function to process test results
process_results() {
  echo -e "\n${YELLOW}Test Results:${NC}"
  echo "----------------------------------------"

  for tutorial in "${TUTORIALS[@]}"; do
    local tutorial_name=$(basename "$tutorial")
    local result_file="$TEMP_DIR/${tutorial_name}.result"
    local log_file="$TEMP_DIR/${tutorial_name}.log"

    if [ -f "$result_file" ]; then
      local result=$(cat "$result_file")
      case "$result" in
      "SUCCESS")
        echo -e "${GREEN}✓ $tutorial_name: PASSED${NC}"
        ((SUCCESS++))
        ;;
      "FAILED")
        echo -e "${RED}✗ $tutorial_name: FAILED${NC}"
        ((FAILURE++))
        echo -e "${YELLOW}  Check log file for details: $log_file${NC}"
        ;;
      "SKIPPED")
        echo -e "${YELLOW}○ $tutorial_name: SKIPPED${NC}"
        ;;
      esac
    else
      echo -e "${RED}? $tutorial_name: NO RESULT${NC}"
    fi
  done

  echo "----------------------------------------"
}

# Display configuration
echo -e "${YELLOW}Running tests with the following configuration:${NC}"
echo "  Parallel execution: $PARALLEL"
if [ "$PARALLEL" = true ]; then
  echo "  Max parallel jobs: $MAX_PARALLEL"
fi
echo "  Port: $PORT"
echo "  Timeout: $TIMEOUT ms"
echo "  Application readiness checks: $MAX_RETRIES (every $RETRY_INTERVAL seconds)"
echo "  Skip npm install: $SKIP_INSTALL"
echo "  Clean node_modules: $CLEAN_NODE_MODULES"
echo "  OpenVidu components version: $OPENVIDU_COMPONENTS_ANGULAR_VERSION"
if [ ${#SKIP_TUTORIALS[@]} -gt 0 ]; then
  echo "  Skipping tutorials: ${SKIP_TUTORIALS[*]}"
fi
if [ ${#ONLY_TUTORIALS[@]} -gt 0 ]; then
  echo "  Only running tutorials: ${ONLY_TUTORIALS[*]}"
fi
echo "----------------------------------------"

# Run tests sequentially or in parallel
if [ "$PARALLEL" = true ]; then
  # Run tests in parallel with limited concurrency
  echo -e "${YELLOW}Running tests in parallel (max $MAX_PARALLEL jobs)${NC}"

  # Use xargs to run up to MAX_PARALLEL jobs at once
  printf '%s\n' "${TUTORIALS[@]}" | xargs -I{} -P "$MAX_PARALLEL" bash -c "$(declare -f check_app_ready run_test find_available_port); run_test {}"
else
  # Run tests sequentially
  echo -e "${YELLOW}Running tests sequentially${NC}"
  for tutorial in "${TUTORIALS[@]}"; do
    run_test "$tutorial"
  done
fi

# Process and display results
process_results

# Calculate total duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Summary
echo -e "\n${YELLOW}Summary:${NC}"
echo "  Duration: ${MINUTES}m ${SECONDS}s"
echo -e "  Successful tests: ${GREEN}$SUCCESS${NC}"
echo -e "  Failed tests: ${RED}$FAILURE${NC}"
echo -e "  Skipped tests: ${YELLOW}$((TOTAL - SUCCESS - FAILURE))${NC}"

# Save all logs to a single file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="test_run_${TIMESTAMP}.log"
echo -e "Saving all logs to ${LOG_FILE}"
for tutorial in "${TUTORIALS[@]}"; do
  tutorial_name=$(basename "$tutorial")
  log_file="$TEMP_DIR/${tutorial_name}.log"
  if [ -f "$log_file" ]; then
    echo -e "\n\n===== $tutorial_name =====" >>"$LOG_FILE"
    cat "$log_file" >>"$LOG_FILE"
  fi
done

# Exit with error code if there are failed tests
if [ $FAILURE -gt 0 ]; then
  exit 1
fi
exit 0
