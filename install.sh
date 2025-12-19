#!/bin/sh
set -e

# devex installer
# Usage: curl -fsSL https://raw.githubusercontent.com/wellwright/devex/main/install.sh | sh

REPO="wellwright/devex"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        darwin) OS="macos" ;;
        linux) OS="linux" ;;
        mingw*|msys*|cygwin*) OS="windows" ;;
        *) echo "Unsupported OS: $OS"; exit 1 ;;
    esac

    case "$ARCH" in
        x86_64|amd64) ARCH="x64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    echo "${OS}-${ARCH}"
}

# Get latest release version
get_latest_version() {
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" |
        grep '"tag_name"' |
        sed -E 's/.*"([^"]+)".*/\1/'
}

main() {
    PLATFORM=$(detect_platform)
    VERSION=$(get_latest_version)

    if [ -z "$VERSION" ]; then
        echo "Error: Could not determine latest version"
        exit 1
    fi

    BINARY_NAME="devex-${PLATFORM}"
    if [ "$PLATFORM" = "windows-x64" ]; then
        BINARY_NAME="devex-windows-x64.exe"
    fi

    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${BINARY_NAME}"

    echo "Installing devex ${VERSION} for ${PLATFORM}..."
    echo "Downloading from: ${DOWNLOAD_URL}"

    # Create temp directory
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Download binary
    curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/devex"

    # Make executable
    chmod +x "${TMP_DIR}/devex"

    # Move to install directory
    if [ -w "$INSTALL_DIR" ]; then
        mv "${TMP_DIR}/devex" "${INSTALL_DIR}/devex"
    else
        echo "Installing to ${INSTALL_DIR} (requires sudo)..."
        sudo mv "${TMP_DIR}/devex" "${INSTALL_DIR}/devex"
    fi

    echo "Successfully installed devex to ${INSTALL_DIR}/devex"
    echo "Run 'devex --help' to get started"
}

main
