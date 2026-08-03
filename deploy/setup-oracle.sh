#!/usr/bin/env bash
# Configura CapLearn en una VM Ubuntu de Oracle Cloud (Always Free).
# Corré esto por SSH, dentro de la VM, después de clonar el repo.
#
# Uso:
#   git clone https://github.com/dacerioas/caplearn.git
#   cd caplearn
#   chmod +x deploy/setup-oracle.sh
#   ./deploy/setup-oracle.sh

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Usando repo en: $REPO_DIR"

echo "== 1/6: Instalando Node.js 22 (necesario para node:sqlite) =="
if ! command -v node >/dev/null || [ "$(node -v | grep -oE '^v[0-9]+' | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo "== 2/6: Instalando nginx y pm2 =="
sudo apt-get update -y
sudo apt-get install -y nginx
sudo npm install -g pm2

echo "== 3/6: Instalando dependencias del servidor =="
cd "$REPO_DIR/server"
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "!! Creé server/.env a partir de .env.example. Antes de continuar, editalo:"
  echo "   nano $REPO_DIR/server/.env"
  echo "   y completá GEMINI_API_KEY, UNSPLASH_ACCESS_KEY y un SESSION_SECRET nuevo."
  echo "   Corré este script de nuevo cuando termines."
  exit 0
fi

echo "== 4/6: Arrancando el servidor con pm2 =="
pm2 delete caplearn 2>/dev/null || true
pm2 start server.js --name caplearn
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | sudo bash || true

echo "== 5/6: Configurando nginx como reverse proxy (puerto 80 -> 3000) =="
sudo tee /etc/nginx/sites-available/caplearn >/dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/caplearn /etc/nginx/sites-enabled/caplearn
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "== 6/6: Abriendo el puerto 80 en el firewall del sistema operativo =="
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT || true
sudo netfilter-persistent save 2>/dev/null || true

echo ""
echo "Listo. La app debería responder en: http://<IP-publica-de-tu-VM>"
echo ""
echo "IMPORTANTE: además de esto, tenés que abrir el puerto 80 en la"
echo "'Security List' o 'Network Security Group' de tu VCN, desde el panel"
echo "web de Oracle Cloud (esto es un firewall aparte, a nivel de la nube,"
echo "no del sistema operativo)."
echo ""
echo "Para actualizar la app luego de un cambio:"
echo "  cd $REPO_DIR && git pull && cd server && npm install && pm2 restart caplearn"
