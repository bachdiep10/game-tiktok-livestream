@echo off
rem Mo game Boi bai Tarot trong mot cua so Microsoft Edge rieng, khung doc, khong co thanh dia chi
rem de TikTok LIVE Studio chup cua so nay (Window capture).
rem Dung ho so Edge rieng (TarotLive) de lenh "cho phep tu phat nhac" luon co tac dung.
start "" msedge --user-data-dir="%LOCALAPPDATA%\TarotLive" --no-first-run --new-window --app=http://127.0.0.1:3000/tarot.html --window-size=608,1110 --autoplay-policy=no-user-gesture-required
