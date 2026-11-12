#!/bin/bash
# Vercel "Ignored Build Step": exit 0 = skip this build, exit 1 = build.
# Runs in the project root (frontend/). Only rebuild when something under frontend/ changed,
# so backend-only and docs-only commits don't create deployments (they eat the 10 GB storage).
# When in doubt (unknown base, shallow clone), build.

BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$BASE" ] && git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  if git diff --quiet "$BASE" HEAD -- .; then
    echo "No frontend changes since last deployment ${BASE:0:7}; skipping build."
    exit 0
  fi
  echo "Frontend changed since ${BASE:0:7}; building."
  exit 1
fi

if git rev-parse -q --verify HEAD^ >/dev/null 2>&1 && git diff --quiet HEAD^ HEAD -- .; then
  echo "No frontend changes in this commit; skipping build."
  exit 0
fi
echo "Frontend changed (or no comparable base); building."
exit 1
