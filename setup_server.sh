#!/bin/bash
set -e

echo "=== AI Meeting Notes Agent - Server Setup ==="
echo ""

# 1. Install system dependencies
echo "Installing system dependencies..."
sudo apt update && sudo apt install -y python3 python3-venv python3-pip curl ffmpeg

# 2. Install rclone
if ! command -v rclone &> /dev/null; then
    echo "Installing rclone..."
    curl https://rclone.org/install.sh | sudo bash
else
    echo "rclone already installed: $(rclone version | head -1)"
fi

# 3. Python environment
echo ""
echo "Setting up Python environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Create working directories
echo ""
echo "Creating inbox directory..."
sudo mkdir -p /srv/transcribe/inbox
sudo chown "$USER:$USER" /srv/transcribe/inbox

# 5. Configure .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo ">>> EDIT .env with your API keys: nano .env"
    echo "    Required: ASSEMBLY_API_KEY"
    echo ""
fi

# 6. Configure rclone for Google Drive
echo ""
echo "=== Google Drive Setup ==="
echo "You'll now configure rclone to access Google Drive."
echo "When prompted:"
echo "  - Name: gdrive"
echo "  - Storage type: drive (Google Drive)"
echo "  - Accept defaults for most options"
echo "  - Auto config: Yes (browser will open)"
echo ""
read -p "Press Enter to start rclone config..."
rclone config

# 7. Prompt for Drive folder name
echo ""
read -p "Google Drive folder name to watch (e.g. VoiceMemos): " DRIVE_FOLDER

# Append Drive config to .env (avoid duplicates)
grep -q '^RCLONE_REMOTE=' .env 2>/dev/null && sed -i 's/^RCLONE_REMOTE=.*/RCLONE_REMOTE=gdrive/' .env || echo "RCLONE_REMOTE=gdrive" >> .env
grep -q '^GDRIVE_FOLDER=' .env 2>/dev/null && sed -i "s/^GDRIVE_FOLDER=.*/GDRIVE_FOLDER=${DRIVE_FOLDER}/" .env || echo "GDRIVE_FOLDER=${DRIVE_FOLDER}" >> .env
grep -q '^LOCAL_INBOX_DIR=' .env 2>/dev/null || echo "LOCAL_INBOX_DIR=/srv/transcribe/inbox" >> .env

# 8. Verify rclone access
echo ""
echo "Verifying Google Drive access..."
rclone lsd "gdrive:${DRIVE_FOLDER}" && echo "OK: folder accessible" || echo "WARNING: could not access folder '${DRIVE_FOLDER}'"

# 9. Install systemd services
echo ""
read -p "Install systemd services? (y/n): " INSTALL_SERVICES
if [ "$INSTALL_SERVICES" = "y" ]; then
    INSTALL_DIR=$(pwd)

    sed -e "s|/opt/ai-meeting-notes-agent|${INSTALL_DIR}|g" \
        -e "s|User=%i|User=${USER}|g" \
        systemd/drive-watcher.service | sudo tee /etc/systemd/system/drive-watcher.service > /dev/null

    sed -e "s|/opt/ai-meeting-notes-agent|${INSTALL_DIR}|g" \
        -e "s|User=%i|User=${USER}|g" \
        systemd/rclone-sync.service | sudo tee /etc/systemd/system/rclone-sync.service > /dev/null

    sudo cp systemd/rclone-sync.timer /etc/systemd/system/

    sudo systemctl daemon-reload
    sudo systemctl enable drive-watcher rclone-sync.timer

    echo ""
    echo "Services installed. Start with:"
    echo "  sudo systemctl start drive-watcher rclone-sync.timer"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Test manually:"
echo "  rclone copy 'gdrive:${DRIVE_FOLDER}' /srv/transcribe/inbox/ --ignore-existing"
echo "  source .venv/bin/activate"
echo "  python drive_watcher.py --dry-run"
