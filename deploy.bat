@echo off
echo === Pushing schema changes to database ===
call npx prisma db push --accept-data-loss
echo.
echo === Committing all code changes ===
git add -A
git commit -m "Fix: real data dashboard, notifications, verification flow, recording duration field"
echo.
echo === Deploying to Vercel ===
call npx vercel --prod --yes
echo.
echo === DONE ===
pause
