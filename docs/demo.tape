# VHS Demo for devex
# https://github.com/charmbracelet/vhs
#
# To regenerate:
#   rm -rf /tmp/devex-demo && vhs docs/demo.tape

Output docs/demo.gif
Set FontSize 16
Set Width 900
Set Height 600
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
Set Shell zsh

# Use a fresh data directory (clean it before running: rm -rf /tmp/devex-demo)
Env DEVEX_DATA_DIR "/tmp/devex-demo"

# Title pause
Sleep 1.5s

# Initialize experiment
Type "devex init ai-test --template ai-coding"
Enter
Sleep 2s

# Don't customize - accept defaults
Type "n"
Enter
Sleep 1s

# No reminders for demo
Type "n"
Enter
Sleep 3s

# Start a block
Type "devex block start no-ai"
Enter
Sleep 3.5s

# Check status
Type "devex status"
Enter
Sleep 4s

# Do a checkin
Type "devex checkin"
Enter
Sleep 1.5s

# Energy: 4
Type "4"
Enter
Sleep 500ms

# Focus: 3
Type "3"
Enter
Sleep 500ms

# Not stuck
Type "n"
Enter
Sleep 500ms

# One word for feeling
Type "hungry"
Enter
Sleep 3s

# Log a quick note
Type "devex log 'Fixed the login bug, tests passing'"
Enter
Sleep 3s

# Show status again
Type "devex status"
Enter
Sleep 4s

# Final pause
Sleep 2s
