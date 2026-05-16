@echo off
git add -A
git commit -m "Production: Supabase Auth, PostgreSQL, Storage integration"
git branch -M main
git pull origin main --rebase --allow-unrelated-histories
git push origin main
