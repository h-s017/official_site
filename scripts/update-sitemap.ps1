[CmdletBinding()]
param(
  [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sitemapPath = Join-Path $repoRoot 'sitemap.xml'
$configPath = Join-Path $repoRoot 'assets\cms-config.js'

$config = Get-Content -Raw -LiteralPath $configPath
$supabaseUrl = [regex]::Match($config, "supabaseUrl:\s*'([^']+)'").Groups[1].Value
$supabaseKey = [regex]::Match($config, "supabaseAnonKey:\s*'([^']+)'").Groups[1].Value
if (-not $supabaseUrl -or -not $supabaseKey) {
  throw 'Unable to read the public CMS connection settings.'
}

$headers = @{
  apikey = $supabaseKey
  Authorization = "Bearer $supabaseKey"
}
$endpoint = "$supabaseUrl/rest/v1/posts?status=eq.published&select=slug,published_at&order=published_at.desc"
$response = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get -TimeoutSec 30
$posts = @($response | ForEach-Object { $_ })

[xml]$currentXml = Get-Content -Raw -LiteralPath $sitemapPath
$namespace = New-Object System.Xml.XmlNamespaceManager($currentXml.NameTable)
$namespace.AddNamespace('sm', 'http://www.sitemaps.org/schemas/sitemap/0.9')
$staticEntries = @(
  $currentXml.SelectNodes('//sm:url', $namespace) | ForEach-Object {
    $loc = $_.SelectSingleNode('sm:loc', $namespace).InnerText
    if ($loc -notlike 'https://hanascent.com/blog.html?slug=*') {
      [pscustomobject]@{
        Loc = $loc
        LastMod = if ($_.SelectSingleNode('sm:lastmod', $namespace)) { $_.SelectSingleNode('sm:lastmod', $namespace).InnerText } else { $null }
        Priority = if ($_.SelectSingleNode('sm:priority', $namespace)) { $_.SelectSingleNode('sm:priority', $namespace).InnerText } else { $null }
      }
    }
  }
)

$entries = @($staticEntries) + @(
  $posts | ForEach-Object {
    [pscustomobject]@{
      Loc = "https://hanascent.com/blog.html?slug=$($_.slug)"
      LastMod = if ($_.published_at) { ([datetimeoffset]$_.published_at).ToString('yyyy-MM-dd') } else { $null }
      Priority = '0.6'
    }
  }
)

$settings = New-Object System.Xml.XmlWriterSettings
$settings.OmitXmlDeclaration = $true
$settings.Indent = $true
$settings.IndentChars = '  '
$settings.NewLineChars = "`r`n"
$settings.NewLineHandling = 'Replace'
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)
$builder = New-Object System.Text.StringBuilder
$writer = [System.Xml.XmlWriter]::Create($builder, $settings)
$writer.WriteStartElement('urlset', 'http://www.sitemaps.org/schemas/sitemap/0.9')
foreach ($entry in $entries) {
  $writer.WriteStartElement('url')
  $writer.WriteElementString('loc', $entry.Loc)
  if ($entry.LastMod) { $writer.WriteElementString('lastmod', $entry.LastMod) }
  if ($entry.Priority) { $writer.WriteElementString('priority', $entry.Priority) }
  $writer.WriteEndElement()
}
$writer.WriteEndElement()
$writer.Flush()
$writer.Close()
$desired = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`r`n" + $builder.ToString() + "`r`n"
$current = Get-Content -Raw -LiteralPath $sitemapPath

if ($current -eq $desired) {
  Write-Output "Sitemap is current ($($posts.Count) published articles)."
  exit 0
}

$oldArticleUrls = @(
  [regex]::Matches($current, 'https://hanascent\.com/blog\.html\?slug=[^<]+') | ForEach-Object { $_.Value }
)
$newArticleUrls = @($entries | Where-Object { $_.Loc -like 'https://hanascent.com/blog.html?slug=*' } | ForEach-Object { $_.Loc })
$added = @($newArticleUrls | Where-Object { $_ -notin $oldArticleUrls })
$removed = @($oldArticleUrls | Where-Object { $_ -notin $newArticleUrls })

if ($CheckOnly) {
  Write-Output "Sitemap needs an update: +$($added.Count) / -$($removed.Count) article URLs."
  exit 2
}

[System.IO.File]::WriteAllText($sitemapPath, $desired, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Updated sitemap: +$($added.Count) / -$($removed.Count) article URLs; $($posts.Count) published articles total."
