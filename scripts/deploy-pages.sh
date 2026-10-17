#!/usr/bin/env bash
# Build web/ from the current checkout and publish it to the gh-pages branch.
# Run from a clean checkout of main after any merge that touches web/ or data/rounds/
# (including data/rounds/extra/).
# The site is static: showcase rounds are copied in as /rounds/*.json so it works
# with no backend. No API keys are ever read or bundled here.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"
sha="$(git rev-parse --short HEAD)"
branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "main" ] && [ "${ALLOW_NON_MAIN:-0}" != "1" ]; then
  echo "deploy-pages: run this on main (or set ALLOW_NON_MAIN=1)" >&2
  exit 1
fi

# Optional: VITE_API_BASE=https://<api-host> bakes the public API origin into the build
# (Vite reads VITE_* at build time). Unset = relative /api, i.e. bundled rounds only on Pages.
# The web app has to read import.meta.env.VITE_API_BASE for this to matter (deploy/README.md).
if [ -n "${VITE_API_BASE:-}" ]; then
  case "$VITE_API_BASE" in
    https://*) ;;
    *) echo "deploy-pages: VITE_API_BASE must start with https:// (Pages is https)" >&2; exit 1 ;;
  esac
  export VITE_API_BASE="${VITE_API_BASE%/}"
  echo "deploy-pages: API base $VITE_API_BASE"
fi

(cd web && npm ci --no-audit --no-fund >/dev/null && npm run build)

out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
cp -R web/dist/. "$out/"
mkdir -p "$out/rounds"
if compgen -G "data/rounds/*.json" >/dev/null; then
  cp data/rounds/*.json "$out/rounds/"
fi
python3 -c 'import json,pathlib; print(json.dumps(sorted(p.stem for p in pathlib.Path("data/rounds").glob("*.json"))))' \
  > "$out/rounds/index.json"
# Hand-reviewed extra topics ship at /rounds/extra/ with their own index
# (slug, topic, aliases) so the site can match a typed topic with no backend.
mkdir -p "$out/rounds/extra"
if compgen -G "data/rounds/extra/*.json" >/dev/null; then
  cp data/rounds/extra/*.json "$out/rounds/extra/"
fi
python3 -c 'import json,pathlib; print(json.dumps([{"slug": d["slug"], "topic": d["topic"], "aliases": d.get("aliases", [])} for d in (json.loads(p.read_text()) for p in sorted(pathlib.Path("data/rounds/extra").glob("*.json"))) if d.get("reviewed")]))' \
  > "$out/rounds/extra/index.json"
touch "$out/.nojekyll"
cp "$out/index.html" "$out/404.html"   # deep links fall back to the app

if grep -rlE 'AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9_-]{20,}' "$out" >/dev/null 2>&1; then
  echo "deploy-pages: something key-shaped is in the build; aborting" >&2
  exit 1
fi

wt="$(mktemp -d)"
trap 'rm -rf "$out"; git worktree remove --force "$wt" 2>/dev/null || true' EXIT
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch -q origin gh-pages
  git worktree add -q "$wt" origin/gh-pages --detach
else
  git worktree add -q --detach "$wt"
  (cd "$wt" && git checkout -q --orphan gh-pages-new && git rm -rq --cached . >/dev/null 2>&1 || true)
fi
find "$wt" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$out/." "$wt/"
(
  cd "$wt"
  git add -A
  if git diff --cached --quiet; then
    echo "deploy-pages: nothing changed"
    exit 0
  fi
  git commit -qm "Deploy web from main @ $sha"
  git push -q origin HEAD:refs/heads/gh-pages
)
echo "deploy-pages: published main @ $sha to gh-pages"
