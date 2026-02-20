[CmdletBinding()]
Param()
$File = "public\cam.jpg"
$Args = @(
    "-f", "dshow",
    "-i", "video=`"HD Pro Webcam C920`"",
    "-frames:v", "1",
    "-update", "1",
    "-y", $File
)
Start-Process -FilePath "ffmpeg" -ArgumentList $Args -NoNewWindow -Wait
Write-Host "Foto salva em $File"
