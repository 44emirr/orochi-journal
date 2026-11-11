#!/usr/bin/env bash
# Builds the journal two ways:
#   OrochiJournal.html  one self-contained file (works offline, open it straight from disk)
#   docs/               the website / phone app that GitHub Pages serves (index.html + app files)
set -e
cd "$(dirname "$0")"
OUT="${1:-OrochiJournal.html}"
{
  cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="theme-color" content="#000000"/>
<meta name="color-scheme" content="dark"/>
<meta name="description" content="A free trading journal by Orochi Trading. Your trades stay on your device."/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black"/>
<meta name="apple-mobile-web-app-title" content="Orochi"/>
<title>Orochi Journal</title>
<link rel="manifest" href="manifest.webmanifest"/>
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
HEAD
  cat src/*.css
  echo '</style>'
  echo '</head>'
  echo '<body>'
  echo '<canvas id="stage" aria-hidden="true"></canvas>'
  echo '<div id="root"></div>'
  cat vendor/react.html vendor/react-dom.html
  printf '<script>window.__LOGO="data:image/jpeg;base64,'; cat vendor/logo.b64; printf '";window.__MARK="data:image/jpeg;base64,'; cat vendor/mark.b64; printf '";</script>\n'
  echo '<script>'
  echo '(function(){"use strict";'
  cat src/*.js
  echo '})();'
  echo '</script>'
  # Offline + installable app. Only runs on a real website, never from a file on disk.
  echo '<script>if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}</script>'
  echo '</body>'
  echo '</html>'
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT") bytes)"

# Website / phone app for GitHub Pages
rm -rf docs && mkdir -p docs
cp "$OUT" docs/index.html
cp -r src-web/icons src-web/manifest.webmanifest docs/
VERSION="$(md5sum docs/index.html | cut -c1-10)"
sed "s/__VERSION__/$VERSION/" src-web/sw.js > docs/sw.js
touch docs/.nojekyll
echo "built docs/ (version $VERSION)"
