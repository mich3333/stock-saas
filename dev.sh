#!/bin/bash
# Stock SaaS - tmux dev environment
# Runs: dev server + TypeScript watch + lint watch + error log

SESSION="stock-dev"
DIR="/Users/michaelsepiashvlil6icloud.com/Desktop/stock-saas"

# Kill existing session if running
tmux kill-session -t "$SESSION" 2>/dev/null

# Create new session with first window: Next.js dev server
tmux new-session -d -s "$SESSION" -x 220 -y 50

# Rename window
tmux rename-window -t "$SESSION:0" "dev"

# Split into 4 panes:
# [0] Top-left:  Next.js dev server
# [1] Top-right: TypeScript watch
# [2] Bot-left:  Lint watch (reruns every 30s)
# [3] Bot-right: Error log tail

# Split right vertically
tmux split-window -t "$SESSION:0" -h

# Split bottom-left
tmux split-window -t "$SESSION:0.0" -v

# Split bottom-right
tmux split-window -t "$SESSION:0.1" -v

# Pane 0 (top-left): Next.js dev server
tmux send-keys -t "$SESSION:0.0" "cd \"$DIR\" && echo '🚀 Next.js Dev Server' && npm run dev 2>&1 | tee /tmp/stock-dev.log" Enter

# Pane 1 (top-right): TypeScript type-check watch
tmux send-keys -t "$SESSION:0.1" "cd \"$DIR\" && echo '🔷 TypeScript Watch' && npx tsc --watch --noEmit" Enter

# Pane 2 (bottom-left): Lint - runs every 30s, shows only errors
tmux send-keys -t "$SESSION:0.2" "cd \"$DIR\" && echo '🔍 Lint Watch (every 30s)' && while true; do clear; echo \"[\$(date '+%H:%M:%S')] Running lint...\"; npm run lint 2>&1 | grep -E 'Error|Warning|error|warning|✖' || echo '✅ No lint issues'; sleep 30; done" Enter

# Pane 3 (bottom-right): Next.js error monitor (filters errors from dev log)
tmux send-keys -t "$SESSION:0.3" "cd \"$DIR\" && echo '🚨 Error Monitor' && sleep 3 && tail -f /tmp/stock-dev.log | grep -E --color=always 'error|Error|ERROR|warn|Warning|✗|failed|Failed|cannot|Cannot'" Enter

# Set pane titles
tmux select-pane -t "$SESSION:0.0" -T "Next.js"
tmux select-pane -t "$SESSION:0.1" -T "TypeScript"
tmux select-pane -t "$SESSION:0.2" -T "Lint"
tmux select-pane -t "$SESSION:0.3" -T "Errors"

# Enable pane borders with titles
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "

# Focus top-left pane
tmux select-pane -t "$SESSION:0.0"

# Attach to session
tmux attach-session -t "$SESSION"
