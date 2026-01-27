@echo off
echo Github Guncelleniyor...
"C:\Users\Selçuk\Downloads\PortableGit\bin\git.exe" add .
"C:\Users\Selçuk\Downloads\PortableGit\bin\git.exe" commit -m "feat: Optimize GymContext persistence, add Membership Status and Health Status columns"
"C:\Users\Selçuk\Downloads\PortableGit\bin\git.exe" push
echo Islem Tamamlandi.
pause
