# Self-Hosting Guide

This guide walks you through setting up Feedub on your own server.

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2+ vCPUs |
| RAM | 512 MB | 1 GB |
| Disk | 1 GB | 10 GB |
| OS | Linux (any), macOS | Ubuntu 22.04+ |
| Python | 3.11+ | 3.12 |
| Node.js | 18+ | 20+ |
| [uv](https://docs.astral.sh/uv/) | latest | latest |
| Git | any | any |

No Docker required. Feedub runs the backend and frontend as native processes and uses SQLite for storage.

Install prerequisites if needed:

```bash
# Python + uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Node.js (via nvm or your package manager)
# https://nodejs.org/en/download
```

If using Ollama locally, add another 4–8 GB RAM depending on the model.

---

## 1. Get Telegram API Credentials

Feedub uses the Telegram API to fetch your messages. You need your own API credentials.

1. Go to [https://my.telegram.org/apps](https://my.telegram.org/apps)
2. Log in with your Telegram phone number
3. Click **API development tools**
4. Fill in the form:
   - **App title**: `Feedub` (or anything you like)
   - **Short name**: `feedub`
   - **Platform**: `Other`
5. Click **Create application**
6. Note your **API ID** (a number) and **API Hash** (a hex string)

These credentials are free and have no usage limits. They identify your app to Telegram's API.

---

## 2. Install and Run

```bash
git clone https://github.com/rukawa917/feedub.git
cd feedub
pip install ./cli
feedub init    # Detects project root, generates config in ~/.feedub/
               # Edit ~/.feedub/.env with your Telegram API credentials
feedub run     # Starts backend and frontend as local processes
```

Visit `http://localhost:5173` (or `http://your-server-ip:5173`).

### What `feedub init` does

- Asks for Telegram API credentials
- Lets you pick an LLM provider (Ollama, OpenAI, Anthropic, Gemini, or custom)
- Auto-generates a secure JWT secret key
- Creates the data directory at `~/.feedub/data/`
- Saves config to `~/.feedub/config.yml`

### CLI Commands

| Command | Description |
|---------|-------------|
| `feedub init` | Interactive setup wizard |
| `feedub run` / `feedub stop` | Start/stop all services |
| `feedub status` | Show service health |
| `feedub logs [service]` | Tail logs (backend, frontend) |
| `feedub backup` | Backup database to `~/.feedub/backups/` |
| `feedub restore <file>` | Restore database from backup |
| `feedub upgrade` | Upgrade to latest version |
| `feedub config` | Show current configuration |
| `feedub uninstall` | Remove all data and processes |

---

## 3. LLM Provider Configuration

Feedub uses [LiteLLM](https://docs.litellm.ai/docs/providers) so you can use 100+ LLM providers. The `feedub init` wizard handles this, but you can also edit `~/.feedub/config.yml` directly.

### Ollama (Local, Free)

The default option. Install Ollama from [ollama.com](https://ollama.com), then pull a model:

```bash
ollama pull llama3.2
```

```yaml
llm:
  enabled: true
  model: ollama/llama3.2
  api_base: http://localhost:11434
  api_key: null
```

Other popular models: `mistral`, `gemma2`, `phi3`, `codellama`.

### OpenAI

```yaml
llm:
  enabled: true
  model: gpt-4o
  api_key: sk-your-openai-api-key
  api_base: null
```

### Anthropic

```yaml
llm:
  enabled: true
  model: claude-sonnet-4-20250514
  api_key: sk-ant-your-anthropic-api-key
  api_base: null
```

### Google Gemini

```yaml
llm:
  enabled: true
  model: gemini/gemini-2.5-pro
  api_key: your-google-api-key
  api_base: null
```

### Custom / Self-Hosted

Any LiteLLM-compatible provider. See the [full provider list](https://docs.litellm.ai/docs/providers).

```yaml
llm:
  enabled: true
  model: openai/my-model        # LiteLLM model string
  api_key: your-api-key         # Optional
  api_base: http://my-llm:8080  # Optional
```

After editing the config, restart with `feedub stop && feedub run`.

---

## 4. Backup and Restore

The SQLite database is a single file at `~/.feedub/feedub.db`. Backups are simple file copies.

```bash
# Create a backup
feedub backup
# Backups are saved to ~/.feedub/backups/feedub-backup-YYYYMMDD.db

# Restore from a backup
feedub restore ~/.feedub/backups/feedub-backup-20260313.db

# Manual backup (copy the file directly)
cp ~/.feedub/feedub.db ~/my-backup.db
```

---

## 5. Troubleshooting

### Backend won't start

```bash
feedub logs backend
```

Common causes:
- **Invalid Telegram credentials**: Double-check API ID and API Hash at [my.telegram.org/apps](https://my.telegram.org/apps).
- **Port 8000 already in use**: Another process is using port 8000. Stop it or change the port in `~/.feedub/config.yml`.
- **Database locked**: Another process may have the SQLite file open. Stop all services with `feedub stop` first.

### LLM insights return errors

```bash
feedub logs backend | grep -i llm
```

- **Ollama not running**: Start Ollama with `ollama serve`.
- **Ollama model not pulled**: Run `ollama pull llama3.2`.
- **API key invalid**: Check your key in `~/.feedub/config.yml`.
- **Timeout**: Large message sets can exceed the default 120s timeout. Reduce the date range or message count.

### Database issues

```bash
# Check service health
feedub status

# Restore from backup
feedub restore ~/.feedub/backups/feedub-backup-20260313.db
```

### Reset everything

```bash
feedub uninstall   # Removes all data and configuration
feedub init        # Start fresh
feedub run
```

---

## 6. Running Behind a Reverse Proxy

For production deployments with HTTPS, put Feedub behind Nginx or Caddy.

### Caddy (simplest)

```
feedub.example.com {
    reverse_proxy localhost:5173
}

api.feedub.example.com {
    reverse_proxy localhost:8000
}
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name feedub.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.feedub.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Set `CORS_ORIGINS` in your backend environment to include your domain:

```
CORS_ORIGINS=https://feedub.example.com
```

And update the frontend to point to your API:

```
VITE_API_BASE_URL=https://api.feedub.example.com
```
