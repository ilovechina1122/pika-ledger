# Cartoon filter for the dog photo:
#   center-crop -> resize 1024 -> posterize (flat color blocks) -> saturation boost -> rounded corners
# Usage: powershell -ExecutionPolicy Bypass -File scripts/make-cartoon-icon.ps1

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
public static class Cartoon {
  static int Q(int v, double step) {
    int q = (int)(Math.Round(v / step) * step);
    return Math.Min(255, Math.Max(0, q));
  }
  static int C(double v) {
    return Math.Min(255, Math.Max(0, (int)v));
  }
  public static Bitmap Process(string srcPath, int levels, double sat) {
    var bmp = new Bitmap(1024, 1024, PixelFormat.Format32bppArgb);
    using (var img = new Bitmap(srcPath)) {
      int side = Math.Min(img.Width, img.Height);
      int cx = (img.Width - side) / 2, cy = (img.Height - side) / 2;
      using (var g = Graphics.FromImage(bmp)) {
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.DrawImage(img, new Rectangle(0, 0, 1024, 1024), new Rectangle(cx, cy, side, side), GraphicsUnit.Pixel);
      }
    }
    double step = 255.0 / (levels - 1);
    for (int y = 0; y < 1024; y++) {
      for (int x = 0; x < 1024; x++) {
        Color p = bmp.GetPixel(x, y);
        int r = Q(p.R, step), g = Q(p.G, step), b = Q(p.B, step);
        double lum = 0.299 * r + 0.587 * g + 0.114 * b;
        bmp.SetPixel(x, y, Color.FromArgb(p.A, C(r + (r - lum) * sat), C(g + (g - lum) * sat), C(b + (b - lum) * sat)));
      }
    }
    return bmp;
  }
}
"@ -ReferencedAssemblies System.Drawing

$srcPath = 'D:/pika-ledger/6934903349c8b207e419b399813c5b84.jpg'
$dstPath = 'D:/pika-ledger/icon-cartoon-preview.png'
$levels = 7
$sat = 0.25

$bmp = [Cartoon]::Process($srcPath, $levels, $sat)

# rounded corners (transparent)
$out = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
$radius = 195
$d = $radius * 2
$clip = New-Object System.Drawing.Drawing2D.GraphicsPath
$clip.AddArc(0, 0, $d, $d, 180, 90)
$clip.AddArc(1024 - $d, 0, $d, $d, 270, 90)
$clip.AddArc(1024 - $d, 1024 - $d, $d, $d, 0, 90)
$clip.AddArc(0, 1024 - $d, $d, $d, 90, 90)
$clip.CloseFigure()
$g.SetClip($clip)
$g.DrawImage($bmp, 0, 0, 1024, 1024)
$g.Dispose()
$out.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$out.Dispose()
Write-Output "OK: $dstPath"
