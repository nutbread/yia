@echo off

:: Test server using lan
..\lan\src\node.x64.exe ..\lan\src\lan.js ^
	--directory "." ^
	--port "80" ^
	--pretty-print ^
	--allow-parent-directories ^
	|| echo Failure
