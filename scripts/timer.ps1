[CmdletBinding()]
Param(
    [int]$Minutos = 5
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$TimerSeconds = $Minutos * 60
$Remaining = $TimerSeconds

$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Cronômetro"
$Form.Size = New-Object System.Drawing.Size(400, 200)
$Form.StartPosition = "CenterScreen"
$Form.TopMost = $true
$Form.BackColor = "#222222"
$Form.ForeColor = "#ffffff"
$Form.FormBorderStyle = "FixedToolWindow"

$Label = New-Object System.Windows.Forms.Label
$Label.Font = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
$Label.TextAlign = "MiddleCenter"
$Label.Dock = "Fill"
$Label.Text = "$Minutos:00"
$Form.Controls.Add($Label)

$Timer = New-Object System.Windows.Forms.Timer
$Timer.Interval = 1000
$Timer.add_Tick({
    $script:Remaining--
    if ($Remaining -lt 0) {
        $Timer.Stop()
        [console]::beep(1000, 500)
        [console]::beep(1000, 500)
        [console]::beep(1000, 500)
        $Label.ForeColor = "Red"
        $Label.Text = "FIM!"
    } else {
        $M = [math]::Floor($Remaining / 60)
        $S = $Remaining % 60
        $Label.Text = "{0:00}:{1:00}" -f $M, $S
        if ($Remaining -lt 10) { $Label.ForeColor = "Orange" }
    }
})

$Timer.Start()
$Form.ShowDialog()
