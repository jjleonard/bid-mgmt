# Deployment (Docker + Cloudflare Tunnel)

## Overview
This setup runs the app container alongside a Cloudflare Tunnel container.
The app uses SQLite stored in a Docker volume and stores uploaded branding
assets in a separate volume.

## One-time server setup
1. Install Docker and Docker Compose.
2. Create a working directory and clone the repo.

```bash
git clone <your-repo-url>
cd bid-mgmt
```

## Configure environment
1. Copy the template and add your values:

```bash
cp deploy/.env.example deploy/.env
```

2. Update `deploy/.env`:
- `APP_BASE_URL` to your domain.
- SMTP settings (Mailgun).
- `CLOUDFLARE_TUNNEL_TOKEN` from Cloudflare.
- Optional: `ADMIN_BOOTSTRAP_TOKEN`.

## Build and run
1. Create local data folders for persistence:

```bash
mkdir -p data branding
```

2. If you already have an admin user, copy your SQLite file into `data/dev.db`.
   (If not, see the note below.)

3. Start the stack:

```bash
docker compose up -d --build
```

Optional wrapper:

```bash
./deploy.sh
```

Note: the Cloudflare tunnel token must be available as an environment variable
when running Compose. `deploy.sh` loads `deploy/.env` for you. If you run Compose
directly, export it first:

```bash
export CLOUDFLARE_TUNNEL_TOKEN=your-token
docker compose up -d --build
```

## Bootstrap the first admin
If you are starting with an empty database, run the bootstrap command once:

1. Add these to `deploy/.env`:
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD` (min 10 chars)
- `ADMIN_BOOTSTRAP_FIRST_NAME`
- `ADMIN_BOOTSTRAP_SURNAME`

2. Run the bootstrap command:

```bash
docker compose run --rm app npm run bootstrap:admin
```

This runs inside the container, so the host does not need Node.js or npm.

If you prefer to skip npm entirely, use:

```bash
docker compose run --rm app node scripts/bootstrap-admin.js
```

Reminder: ensure `deploy/.env` is updated before running the bootstrap.

You can remove the bootstrap values after the admin is created.

This will:
- Build the Next.js app.
- Run Prisma migrations on startup.
- Start the app on port 3000.
- Start the Cloudflare Tunnel container.

## Updating the app
```bash
git pull
docker compose up -d --build
```

## Useful commands
- View logs: `docker compose logs -f app`
- Stop: `docker compose down`

## Deployment checklist
1. `deploy/.env` updated (SMTP, APP_BASE_URL, CLOUDFLARE_TUNNEL_TOKEN).
2. `data/` and `branding/` folders created.
3. `./deploy.sh` run (or `docker compose up -d --build`).
4. Bootstrap admin run if needed.
5. Cloudflare route points to `http://app:3000`.

## Cloudflare tunnel route
In the Cloudflare dashboard, set the route/service to:

```
http://app:3000
```

That targets the app container by service name on the Docker network.

## Notes
- SQLite DB persists in the `data/` folder on the host.
- Branding uploads persist in the `branding/` folder on the host.
- If you run without Cloudflare Tunnel, you can remove the `cloudflared` service.

## Initial admin user
Routes under `/admin` and `/bids` require an admin session. Use the bootstrap
command above or seed a `data/dev.db` before starting the app.
