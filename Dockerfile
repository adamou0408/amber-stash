# Amber Stash — dev image
# 跑 Expo SDK 54 dev server（web 模式），給 docker compose 啟動後即可開瀏覽器測試 + HMR。
FROM node:20-bookworm-slim

# git: expo 部份套件 postinstall 會用到
# tini: 正確處理 PID 1 訊號（Ctrl+C / docker stop）
# Metro 用 metro-file-map 監聽檔案變動，沒裝 watchman 會 fallback 到 fs.watch。
# 在 Linux native filesystem（WSL2 內）fs.watch 工作正常 → HMR 穩定。
# 在 Windows host filesystem 上 Docker Desktop 不保證 fs event 會 propagate，
# watchman 也無法解決（它一樣靠 inotify），所以這裡不額外安裝它。
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先複製 lock 檔做依賴安裝，最大化 docker layer cache
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 把專案內容 copy 進去；dev 時會被 bind mount 蓋掉，但 build image 後仍可獨立跑
COPY . .

# Metro bundler（web / 手機都用這個 port，瀏覽器開 http://localhost:8081）
EXPOSE 8081

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    EXPO_NO_TELEMETRY=1 \
    CI=0

ENTRYPOINT ["/usr/bin/tini", "--"]
# 不加 --host lan：在 container 內 lan 會抓到 docker bridge IP（172.x），
# 反而會印出手機連不到的網址。瀏覽器走 localhost port-forward 即可。
CMD ["npx", "expo", "start", "--web"]
