@echo off
chcp 65001 > nul
title 불로 열방교회 홈페이지 깃허브 자동 배포기
cls
echo ========================================================
echo        불로 열방교회 홈페이지 - 깃허브 자동 배포기
echo ========================================================
echo.
echo [1/3] 변경된 말씀 및 홈페이지 파일들을 확인하는 중...
git add .

echo [2/3] 변경사항을 안전하게 저장(Commit)하는 중...
git commit -m "Auto sync sermons archive and website content (%date% %time%)"

echo [3/3] 깃허브(GitHub) 서버로 전송 및 배포(Push)하는 중...
git push origin main

echo.
echo ========================================================
echo   🎉 성공! 모든 말씀과 변경사항이 깃허브에 배포되었습니다!
echo   약 1~2분 후 홈페이지에 전세계 반영됩니다.
echo ========================================================
echo.
pause
