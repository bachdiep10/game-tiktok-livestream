@echo off
rem Mo game Doi Cun Quay trong mot cua so Microsoft Edge rieng, khung doc, khong co thanh dia chi
rem de TikTok LIVE Studio chup cua so nay (Window capture).
rem Dung ho so Edge rieng (DoiCunLive) de lenh "cho phep tu phat nhac" luon co tac dung.
start "" msedge --user-data-dir="%LOCALAPPDATA%\DoiCunLive" --no-first-run --new-window --app=http://127.0.0.1:3000/doi-cun.html --window-size=608,1110 --autoplay-policy=no-user-gesture-required
