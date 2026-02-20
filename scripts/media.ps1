[CmdletBinding()]
Param(
    [string]$Cmd = "play"
)

$obj = New-Object -ComObject WScript.Shell
$Key = ""

switch ($Cmd) {
    "play" { $Key = [char]0xB3 } # VK_MEDIA_PLAY_PAUSE
    "next" { $Key = [char]0xB0 } # VK_MEDIA_NEXT_TRACK
    "prev" { $Key = [char]0xB1 } # VK_MEDIA_PREV_TRACK
    "vol_up" { $Key = [char]0xAF } # VK_VOLUME_UP
    "vol_down" { $Key = [char]0xAE } # VK_VOLUME_DOWN
    "mute" { $Key = [char]0xAD } # VK_VOLUME_MUTE
}

if ($Key) {
    $obj.SendKeys($Key)
}
else {
    Write-Host "Comando desconhecido: $Cmd"
}
