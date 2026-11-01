@echo off
rem Mo game trong mot cua so Chrome rieng, khung doc, khong co thanh dia chi
rem de TikTok LIVE Studio chup cua so nay (Window capture).
start "" chrome --new-window --app=http://127.0.0.1:3000/game.html --window-size=608,1110 --autoplay-policy=no-user-gesture-required
