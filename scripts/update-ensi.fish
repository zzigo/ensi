function update-ensi
    set app_dir /opt/ensi
    set repo_url https://github.com/zzigo/ensi.git
    set backend_port 3100

    echo "Pushing main to GitHub..."
    git push origin main

    echo "Deploying ENSi to 46.225.154.68..."
    ssh zz@46.225.154.68 "bash -lc 'set -euo pipefail; mkdir -p $app_dir; cd $app_dir; if [ ! -d .git ]; then git clone $repo_url .; fi; git fetch origin main; git checkout main; git pull --ff-only origin main; bun install; bun run build; mkdir -p scores server/public; pm2 delete ensi >/dev/null 2>&1 || true; cd server; PORT=$backend_port ENSI_SCORES_DIR=$app_dir/scores pm2 start /home/zz/.bun/bin/bun --name ensi -- src/index.ts; pm2 save'"
end
