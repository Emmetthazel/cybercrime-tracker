@echo off
REM ============================================
REM Script de génération des diagrammes UML
REM Cybercrime Tracker Project
REM ============================================

echo ========================================
echo Génération des diagrammes UML
echo ========================================
echo.

REM Vérifier si Java est installé
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Java n'est pas installé!
    echo.
    echo Veuillez installer Java depuis:
    echo https://www.java.com/fr/download/
    echo.
    pause
    exit /b 1
)

echo [OK] Java est installé
echo.

REM Vérifier si plantuml.jar existe
if not exist plantuml.jar (
    echo [INFO] PlantUML non trouvé. Téléchargement en cours...
    echo.
    
    REM Télécharger PlantUML avec PowerShell
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/plantuml/plantuml/releases/download/v1.2023.12/plantuml-1.2023.12.jar' -OutFile 'plantuml.jar'"
    
    if exist plantuml.jar (
        echo [OK] PlantUML téléchargé avec succès
        echo.
    ) else (
        echo [ERREUR] Échec du téléchargement de PlantUML
        echo.
        echo Veuillez télécharger manuellement depuis:
        echo https://plantuml.com/download
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] PlantUML trouvé
    echo.
)

REM Créer le dossier output s'il n'existe pas
if not exist "output" mkdir output

echo ========================================
echo Génération du diagramme de classes
echo ========================================
echo.

REM Générer le diagramme de classes en SVG
echo Génération class-diagram.svg...
java -jar plantuml.jar -tsvg -o output class-diagram.puml
if %errorlevel% equ 0 (
    echo [OK] class-diagram.svg généré
) else (
    echo [ERREUR] Échec de la génération du SVG
)

REM Générer le diagramme de classes en PNG
echo Génération class-diagram.png...
java -jar plantuml.jar -tpng -o output class-diagram.puml
if %errorlevel% equ 0 (
    echo [OK] class-diagram.png généré
) else (
    echo [ERREUR] Échec de la génération du PNG
)

echo.
echo ========================================
echo Génération du diagramme de cas d'utilisation
echo ========================================
echo.

REM Générer le diagramme de cas d'utilisation en SVG
echo Génération usecase-diagram.svg...
java -jar plantuml.jar -tsvg -o output usecase-diagram.puml
if %errorlevel% equ 0 (
    echo [OK] usecase-diagram.svg généré
) else (
    echo [ERREUR] Échec de la génération du SVG
)

REM Générer le diagramme de cas d'utilisation en PNG
echo Génération usecase-diagram.png...
java -jar plantuml.jar -tpng -o output usecase-diagram.puml
if %errorlevel% equ 0 (
    echo [OK] usecase-diagram.png généré
) else (
    echo [ERREUR] Échec de la génération du PNG
)

echo.
echo ========================================
echo Génération terminée!
echo ========================================
echo.
echo Les fichiers ont été générés dans le dossier 'output':
echo - class-diagram.svg
echo - class-diagram.png
echo - usecase-diagram.svg
echo - usecase-diagram.png
echo.

REM Ouvrir le dossier output
explorer output

echo Appuyez sur une touche pour quitter...
pause >nul

