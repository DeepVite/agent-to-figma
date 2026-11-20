@echo off
REM Start the Agent to Figma WebSocket relay and keep it running.
REM Double-click this file (or run it in a terminal). Ctrl+C stops the relay.
title Agent to Figma relay
node "%~dp0socket.mjs"
if errorlevel 1 pause
