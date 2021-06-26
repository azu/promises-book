@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  fopub startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%..

@rem Add default JVM options here. You can also use JAVA_OPTS and FOPUB_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Dxml.catalog.files=%APP_DIR%/catalog.xml"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto init

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto init

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:init
@rem Get command-line arguments, handling Windows variants

if not "%OS%" == "Windows_NT" goto win9xME_args

:win9xME_args
@rem Slurp the command line arguments.
set CMD_LINE_ARGS=
set _SKIP=2

:win9xME_args_slurp
if "x%~1" == "x" goto execute

set CMD_LINE_ARGS=%*

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\lib\fopub-1.0.0-SNAPSHOT.jar;%APP_HOME%\lib\jeuclid-fop-3.1.9.jar;%APP_HOME%\lib\fop-2.1.jar;%APP_HOME%\lib\avalon-framework-impl-4.3.1.jar;%APP_HOME%\lib\avalon-framework-api-4.3.1.jar;%APP_HOME%\lib\xml-resolver-1.2.jar;%APP_HOME%\lib\xslthl-2.1.0.jar;%APP_HOME%\lib\jeuclid-core-3.1.9.jar;%APP_HOME%\lib\xmlgraphics-commons-2.1.jar;%APP_HOME%\lib\batik-transcoder-1.8.jar;%APP_HOME%\lib\batik-extension-1.8.jar;%APP_HOME%\lib\batik-bridge-1.8.jar;%APP_HOME%\lib\batik-script-1.8.jar;%APP_HOME%\lib\batik-anim-1.8.jar;%APP_HOME%\lib\batik-svg-dom-1.8.jar;%APP_HOME%\lib\batik-gvt-1.8.jar;%APP_HOME%\lib\batik-parser-1.8.jar;%APP_HOME%\lib\batik-svggen-1.8.jar;%APP_HOME%\lib\batik-awt-util-1.8.jar;%APP_HOME%\lib\batik-dom-1.8.jar;%APP_HOME%\lib\batik-css-1.8.jar;%APP_HOME%\lib\batik-ext-1.8.jar;%APP_HOME%\lib\commons-logging-1.1.1.jar;%APP_HOME%\lib\commons-io-1.3.1.jar;%APP_HOME%\lib\batik-xml-1.8.jar;%APP_HOME%\lib\batik-util-1.8.jar;%APP_HOME%\lib\xalan-2.7.0.jar;%APP_HOME%\lib\xml-apis-ext-1.3.04.jar

@rem Execute fopub
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %FOPUB_OPTS%  -classpath "%CLASSPATH%" org.apache.fop.cli.Main %CMD_LINE_ARGS%

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable FOPUB_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%FOPUB_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
