function update-ensi
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "🌐 Deploying to 46.225.154.68..."
    ssh zz@46.225.154.68 "cd /opt/ensi; or git clone https://github.com/zzigo/ensi.git .; git pull origin main; bun install; bun run build; pm2 restart ensi; or pm2 start server/src/index.ts --name ensi --interpreter bun"
end
