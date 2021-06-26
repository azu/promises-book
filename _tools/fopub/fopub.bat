@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  fopub script for Windows
@rem
@rem  WARNING: This script has had limited testing!
@rem
@rem ##########################################################################

if "%OS%"=="Windows_NT" setlocal

@rem Store full-qualified drive + path of this script
set PRG_DIR=%~dps0
if "%PRG_DIR%" == "" set PRG_DIR=.

set GRADLEW_CMD=%PRG_DIR%gradlew
set FOPUB_DIR=%PRG_DIR%\build\fopub
set FOPUB_CMD=%FOPUB_DIR%\bin\fopub.bat
set APP_DIR=%FOPUB_DIR%
set DOCBOOK_DIR=%FOPUB_DIR%\docbook

@rem Default output type and config dir. These may be overridden by options
set TYPE=pdf
set DOCBOOK_XSL_DIR=%FOPUB_DIR%\docbook-xsl

@rem Parse command line options
:opt_parse

@rem Check for -H help
if "%~1" == "-h" GOTO :usage

@rem Check for -t XSL dir
if NOT "%~1" == "-t" GOTO :opt_output_type
shift
if "%~1" == "" GOTO :usage_error
set DOCBOOK_XSL_DIR=%~f1
shift
goto :opt_parse

:opt_output_type
@rem Check for -f output format type
if NOT "%~1" == "-f" GOTO :opt_hyphenate
shift
if "%1" == "" GOTO :usage_error
set TYPE=%~1
shift
goto :opt_parse

:opt_hyphenate
if NOT "%~1" == "-H" GOTO :opt_done
shift
set CONVERT_ARGS="-param hyphenate true"

:opt_done
@rem Done with parsing options
set XSLTHL_CONFIG_URI=file:///%DOCBOOK_XSL_DIR%\xslthl-config.xml

@rem Store fully-qualified drive+path+name+extension of source file
set SOURCE_FILE=%~f1
if "%SOURCE_FILE%" == "" goto :usage_error
@rem Store fully-qualified drive+path+name of first argument
set SOURCE_ROOTNAME=%~dpn1
shift

@rem collect any additional arguments to be passed on to FOP
:collect
if [%1] == [] goto :install
set CONVERT_ARGS=%CONVERT_ARGS% %1
shift
goto :collect

:install
if exist "%FOPUB_CMD%" goto endInstall
echo .
echo Initializing application...
"%GRADLEW_CMD%" -q -u installDist
if not "%ERRORLEVEL%"=="0" goto fail
echo Application initialized!
echo .
:endInstall

SETLOCAL ENABLEDELAYEDEXPANSION

@rem Add file protocol
set DOCBOOK_DIR_PARAM=file:///%DOCBOOK_DIR%
@rem replacing \ with / 
set DOCBOOK_DIR_PARAM=!DOCBOOK_DIR_PARAM:\=/!
set XSLTHL_CONFIG_URI=!XSLTHL_CONFIG_URI:\=/!

if "%TYPE%" == "pdf" (
  set OUTPUT_FILE=%SOURCE_ROOTNAME%.pdf
  set OUTPUT_OPT=-pdf
)

if "%TYPE%" == "ps" (
  set OUTPUT_FILE=%SOURCE_ROOTNAME%.ps
  set OUTPUT_OPT=-ps
)

if "%TYPE%" == "fo" (
  set OUTPUT_FILE=%SOURCE_ROOTNAME%.fo
  set OUTPUT_OPT=-foout
)

if NOT "%OUTPUT_FILE%" == "" (
   %FOPUB_CMD% -q -catalog -c "%DOCBOOK_XSL_DIR%\fop-config.xml" -xml "%SOURCE_FILE%" -xsl "%DOCBOOK_XSL_DIR%\fo-pdf.xsl" !OUTPUT_OPT! "!OUTPUT_FILE!" -param highlight.xslthl.config "%XSLTHL_CONFIG_URI%" -param admon.graphics.path "%DOCBOOK_DIR_PARAM%/images/" -param callout.graphics.path "%DOCBOOK_DIR_PARAM%/images/callouts/" %CONVERT_ARGS%
   if not "%ERRORLEVEL%"=="0" goto fail else goto mainEnd
)

echo "Unsupported output type '%TYPE%'. Must be pdf, ps or fo."

:fail
exit /b 1

:usage_error
echo Syntax error!
:usage
@rem Don't use %FOPUB_CMD% here as that points somewhere else!
echo Usage: fopub [-t PATH] [-f FORMAT] [-H] FILE
echo Example: fopub -t \path\to\custom\docbook-xsl mydoc.xml
exit /b 1 

:mainEnd
if "%OS%"=="Windows_NT" endlocal

