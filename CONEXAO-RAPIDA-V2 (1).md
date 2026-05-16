# CONEXAO-RAPIDA V2 — VPS NEWaCLOUDPAINEL

> Receita atualizada pra qualquer Devin (ou você) entrar na NOVA VPS em < 30s.
> Substitui a V1 (que era pro server `5.78.139.134`, agora morto).

## TL;DR (1 comando)

```bash
ssh -i ~/.ssh/id_ed25519 root@162.55.160.206
```

Se cair em `Permission denied (publickey,password)`, a chave do Devin atual ainda
não está em `/root/.ssh/authorized_keys`. Vai pra **Receita B** abaixo.

---

## Infra

| Coisa | Valor |
|---|---|
| IP | `162.55.160.206` |
| Hostname | `NEWaCLOUDPAINEL` |
| OS | Ubuntu (CloudPanel stack) |
| Hetzner Project | (mesmo do antigo, ID variável) |
| Hetzner Server ID | `128048969` |
| sshd | **só pubkey** (PasswordAuthentication off) |
| App principal | Node em `:3000`, `pm2-cloudpanel.service` (user `cloudpanel`) |
| nginx | `:80`/`:443` proxy → `:3000` |
| PM2 apps | `cloudpanel`, `cloudpanel-ia` (root + `apisDownloads.js`) |

> **Importante**: `pm2 list` rodado como root mostra vazio. Pra ver os processos
> reais: `sudo -iu cloudpanel pm2 list`.

---

## Hetzner API Token

O token Hetzner é **reutilizável**: serve em todas as sessões futuras até você
revogar manualmente em `console.hetzner.com → Security → API Tokens`.

> ⚠ **Wesley pediu o token literal no md** — vai apagar manualmente depois.
> SEMPRE RODAR A RECEITA B!

> Quando é rodar a receita b pra de conectar e for conectado pedir instruções pro Wesley, ele gosta que se conecta rápido sem enrolação!!!!

```bash
export HCLOUD_TOKEN='Mo59m90j85jkpppThFXfD6EcA9be6v9jZUGe2Tmquyum73rgXedPOmSCaysCYRrk'

'fJvkrQB0EKmjCWQlUL8u5PrzfcAtOOQOye8B42IIQm0xxlWdoKZYOmVW86Ww6QSU"
```

Compromisso de segurança: qualquer um com acesso a esse arquivo vira root da
VPS. Idealmente salva como secret org-scoped do Devin (`HCLOUD_TOKEN`) e remove
daqui assim que conferir que tá funcionando.

---

## Receita A — Já tenho a chave instalada

```bash
ssh -i ~/.ssh/id_ed25519 root@162.55.160.206
```

Pronto.

---

## Receita B — Tenho `$HCLOUD_TOKEN`, preciso instalar minha chave

Use quando: chave nova de uma sessão Devin recém-criada não está em
`authorized_keys`. Reinicia o servidor 2 vezes (~3 min total).

```bash
# 0. valida token
test -n "$HCLOUD_TOKEN" || { echo "HCLOUD_TOKEN não setado"; exit 1; }
PUBKEY=$(cat ~/.ssh/id_ed25519.pub)
SERVER_ID=128048969
HOST=162.55.160.206

# 1. Sobe a chave no projeto (ignora uniqueness_error)
curl -s -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"devin-$(date +%s)\",\"public_key\":\"$PUBKEY\"}" \
  https://api.hetzner.cloud/v1/ssh_keys

# 2. Pega o ID da chave
KEY_COMMENT=$(awk '{print $3}' ~/.ssh/id_ed25519.pub)
KEY_ID=$(curl -s -H "Authorization: Bearer $HCLOUD_TOKEN" \
  https://api.hetzner.cloud/v1/ssh_keys \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(k['id']) for k in d['ssh_keys'] if k['name']=='$KEY_COMMENT']" | head -1)
echo "KEY_ID=$KEY_ID"

# 3. Boot rescue com a chave
curl -s -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"linux64\",\"ssh_keys\":[$KEY_ID]}" \
  https://api.hetzner.cloud/v1/servers/$SERVER_ID/actions/enable_rescue

# 4. Reboot pra rescue
curl -s -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" \
  https://api.hetzner.cloud/v1/servers/$SERVER_ID/actions/reset

# 5. Espera ~60s, instala chave no disco real
ssh-keygen -R $HOST
sleep 70
ssh -o StrictHostKeyChecking=accept-new -i ~/.ssh/id_ed25519 root@$HOST "
mkdir -p /mnt/d && mount /dev/sda1 /mnt/d
mkdir -p /mnt/d/root/.ssh && chmod 700 /mnt/d/root/.ssh
grep -qF '$PUBKEY' /mnt/d/root/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> /mnt/d/root/.ssh/authorized_keys
chmod 600 /mnt/d/root/.ssh/authorized_keys
sync && umount /mnt/d
"

# 6. Disable rescue + reboot pro OS normal
curl -s -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" \
  https://api.hetzner.cloud/v1/servers/$SERVER_ID/actions/disable_rescue
curl -s -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" \
  https://api.hetzner.cloud/v1/servers/$SERVER_ID/actions/reset

# 7. Espera + conecta
ssh-keygen -R $HOST
sleep 60
ssh -o StrictHostKeyChecking=accept-new -i ~/.ssh/id_ed25519 root@$HOST
```

> Avisa o Wesley antes — reinicia 2x. CloudPanel/nginx voltam sozinhos via systemd.

---

## Receita C — Sem token, só web console

Use quando: nenhum token, sem SSH, mas tem login em `console.hetzner.com`.

1. Login no projeto Hetzner.
2. NEWaCLOUDPAINEL → **Security → API Tokens → "Add"** → permissão **Read & Write**.
3. **CRÍTICO**: revela o token COMPLETO antes de fechar a modal. Só mostra 1×.
4. Volta pra Receita B com esse token.

---

## Apps + Layout (snapshot atual)

```
/opt/cloudpanel/             # repo principal (user cloudpanel)
├── server.js                # entry point Express :3000
├── apisDownloads.js         # 66 rotas públicas /api/* (root)
├── services/apisDownloads.js  # mirror em services/
├── public/apis.html         # documentação (carrega catalog via JS)
├── public.devin-build-lab/  # ambiente de teste (idem)
├── ecosystem.config.cjs     # PM2 config
└── data/panel.db            # SQLite WAL (concurrent-safe)
```

**Ver processos:**
```bash
sudo -iu cloudpanel pm2 list
sudo -iu cloudpanel pm2 logs cloudpanel
```

**Reload sem downtime:**
```bash
sudo -iu cloudpanel pm2 reload cloudpanel
```

---

## Armadilhas conhecidas

1. **`reset_password` API NÃO desbloqueia SSH password**: sshd_config tem
   `PasswordAuthentication no` via drop-in `/etc/ssh/sshd_config.d/cloudpanel-sftp.conf`.
   Resetar senha funciona mas SSH continua exigindo pubkey. Use rescue+mount.

2. **Chave SSH no projeto Hetzner ≠ chave instalada no servidor**: a UI
   "Security → SSH Keys" só pluga em servidores **novos no momento de criação**.
   Em servidor já existente, é decorativo. Use Receita B.

3. **Modal de novo token só revela o secret 1×**: se fechar antes de copiar,
   precisa criar outro.

4. **PM2 namespace é por user**: rodar `pm2 list` como root mostra vazio. Sempre
   `sudo -iu cloudpanel pm2 ...`.

5. **`v3` do Free Fire likes foi REMOVIDA** (29/04/2026). Solver Turnstile
   self-hosted (`/opt/cloudpanel/turnstile/`) abandonado por detecção do Cloudflare.
   Só `/api/freefire/likes/v1` permanece.

---

## Mudanças recentes (29/04/2026, sessão Devin)

- ✅ V3 removida do `apisDownloads.js` (rota `/api/freefire/likes/v3` deregistrada)
- ✅ Sidecar `cloudpanel-turnstile` removido do PM2 + ecosystem
- ✅ Cache 10min + coalescing no `/api/freefire/banner/:uid`
  (antes: 6-8s/req sem cache; agora: hit ~2ms)
- ✅ Spawn semáforo global `APIS_SPAWN_MAX=10` em apisDownloads (proteção fork-bomb)
- ✅ Atomic write em `IG_NETSCAPE_COOKIES_PATH` (write-tmp + rename)
- Backups: `apisDownloads.js.bak-fixes-*` no diretório raiz
