import os

# Help answers try codex first; tests never shell out to a real codex unless they opt in.
os.environ.setdefault("MM_HELP_CODEX", "0")
