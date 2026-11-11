# Tiny local-only static server used for testing the journal build (127.0.0.1 only).
param([int]$Port = 8787)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.webp' = 'image/webp' }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $rel = [uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'OrochiJournal.html' }
    if ($rel.EndsWith('/')) { $rel = $rel + 'index.html' }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($path.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $path -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      if ($types.ContainsKey($ext)) { $ctx.Response.ContentType = $types[$ext] } else { $ctx.Response.ContentType = 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $ctx.Response.StatusCode = 404 }
  } catch { try { $ctx.Response.StatusCode = 500 } catch {} }
  finally { try { $ctx.Response.Close() } catch {} }
}
