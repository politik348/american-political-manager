#!/usr/bin/env bash
# Snapshot seven draft branches into a disposable directory. Never merge or write team refs.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/scripts" "$tmp/data" "$tmp/docs/audits"
cp v18-news.js "$tmp/"
cp scripts/validate-v18-news.mjs "$tmp/scripts/"
cp data/v18-news.json data/v18-news-index.json data/v18-news-metadata.json "$tmp/data/"
printf '{"type":"module"}\n' > "$tmp/package.json"
for file in data/legislators-historical.json data/legislators-current.json data/historical-people.json; do
  if [ -f "$file" ]; then cp "$file" "$tmp/data/"; fi
done
for i in 01 02 03 04 05 06 07; do
  team="N$i"; branch="v18-news-n$i"
  git fetch --no-tags --depth=1 origin "refs/heads/$branch"
  sha="$(git rev-parse FETCH_HEAD)"
  printf '%s pinned to %s\n' "$team" "$sha"
  git archive "$sha" "data/v18-news-packs/$team" "docs/audits/V18-NEWS-$team-AUDIT.json" | tar -xf - -C "$tmp"
done
node "$tmp/scripts/validate-v18-news.mjs" "$@"
