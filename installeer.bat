@echo off
title Toegankelijkheidstester - Installatie
echo.
echo  ============================================
echo   Toegankelijkheidstester - Installatie
echo  ============================================
echo.

:: Controleer of Node.js aanwezig is
node --version >nul 2>&1
if errorlevel 1 (
    echo  FOUT: Node.js is niet geinstalleerd.
    echo.
    echo  Download Node.js via: https://nodejs.org
    echo  Kies de LTS-versie en installeer die.
    echo  Start daarna dit bestand opnieuw.
    echo.
    pause
    exit /b 1
)

echo  Node.js gevonden. Pakketten installeren...
echo.
call npm install

if errorlevel 1 (
    echo.
    echo  FOUT: Installatie mislukt.
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   Installatie geslaagd!
echo   Dubbelklik nu op: scan.bat
echo  ============================================
echo.
pause
