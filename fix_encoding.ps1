$file = '.\src\pages\Admin.tsx'
$content = Get-Content $file -Raw -Encoding UTF8

# Fix corrupted emojis: replace multi-byte mojibake sequences with correct Unicode chars
# Lock: ðŸ"' -> 🔒
$content = $content.Replace("ðŸ""'", [char]::ConvertFromUtf32(0x1F512))
# Hourglass: â³ -> ⏳
$content = $content.Replace("â³", [char]::ConvertFromUtf32(0x23F3))
# Scroll: ðŸ"œ -> 📜
$content = $content.Replace("ðŸ`"œ", [char]::ConvertFromUtf32(0x1F4DC))
# Approve checkmark: Ã¢Å"â€¦ -> ✅
$content = $content.Replace("Ã¢Å`"â€¦", [char]::ConvertFromUtf32(0x2705))
# Green circle: ðŸŸ¢ -> 🟢
$content = $content.Replace("ðŸŸ¢", [char]::ConvertFromUtf32(0x1F7E2))
# White circle: âšª -> ⚪
$content = $content.Replace("âšª", [char]::ConvertFromUtf32(0x26AA))
# Castle is at peace: estÃ¡ -> está
$content = $content.Replace("estÃ¡", "está")

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Encoding fix complete!"
