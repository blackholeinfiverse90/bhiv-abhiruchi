# 🚀 Gurukul Assessment System (`bhiv-abhiruchi`) - Deployment Infrastructure Specification & Runbook

## 1. 🏗️ Overview & Architecture

The **Gurukul Assessment System (`bhiv-abhiruchi`)** is containerized into a microservice-oriented topology with isolated frontend, backend API, and database services.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PRODUCTION VM HOST                                   │
│                                                                                  │
│  ┌─────────────────────────────────┐      ┌───────────────────────────────────┐  │
│  │   Abhiruchi Frontend UI         │      │   Abhiruchi Backend API Server    │  │
│  │   Container:                    │      │   Container:                      │  │
│  │   abhiruchi-frontend-prod       │      │   abhiruchi-backend-prod          │  │
│  │   Image:                        │      │   Image:                          │  │
│  │   bhiv/abhiruchi-frontend       │      │   bhiv/abhiruchi-backend          │  │
│  │   Port: 5179 (Host) -> 5173     │      │   Port: 5004 (Host) -> 5000       │  │
│  │   Static SPA Server (serve)     │      │   Node.js Express + dumb-init     │  │
│  └────────────────┬────────────────┘      └─────────────────┬─────────────────┘  │
│                   │                                         │                    │
│                   │ REST API Queries                        │ Mongoose ORM       │
│                   └─────────────────────────────────────────┼──────────────────┐ │
│                                                             │                  │ │
│                                                             ▼                  │ │
│                                                   ┌─────────────────────────┐  │ │
│                                                   │   MongoDB Database      │  │ │
│                                                   │   Atlas / Host Port     │  │ │
│                                                   │   27017                 │  │ │
│                                                   └─────────────────────────┘  │ │
│                                                                                  │
│  Network: abhiruchi-network (Bridge)                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔌 Port Allocations & Service Map

| Service Name | Container Name | Target Image | Container Port | Host Port Mapping | Environment Port Variable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend REST API** | `abhiruchi-backend-prod` | `bhiv/abhiruchi-backend:TAG` | `5000` | `5004` | `BACKEND_PORT=5004` |
| **Frontend UI** | `abhiruchi-frontend-prod` | `bhiv/abhiruchi-frontend:TAG` | `5173` | `5179` | `FRONTEND_PORT=5179` |
| **Database (Dev)** | `abhiruchi-mongo-dev` | `mongo:6.0` | `27017` | `27020` | `MONGO_PORT=27020` |

---

## 3. ⚙️ Environment Variables Specification

The system cleanly segregates configuration into two primary layers:

### 3.1 Backend Environment (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Internal HTTP listening port | `5000` |
| `NODE_ENV` | Runtime environment mode | `production` / `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/gurukul_assessment` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5179,http://localhost:5173` |
| `GROQ_API_KEY` | Groq API Key for AI operations | `gsk_...` |
| `CLERK_SECRET_KEY` | Clerk Authentication Secret | Optional / string |
| `CLERK_PUBLISHABLE_KEY` | Clerk Authentication Public Key | Optional / string |

### 3.2 Frontend Environment (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API base URL for client requests | `http://localhost:5004/api` |
| `VITE_GROK_API_KEY` | Groq AI API key for client-side assistance | `gsk_...` |

---

## 4. 🐳 Local Docker Development

### 4.1 Launching the Full Stack Locally

```bash
# 1. Create development environment files from templates
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. Build and start all services (Backend + Frontend + MongoDB)
docker compose up --build -d

# 3. View container status
docker compose ps

# 4. View container logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 4.2 Seeding Database Inside Container

```bash
# Seed question bank and default categories
docker compose exec backend npm run seed

# Seed initial administrative users
docker compose exec backend npm run seed:users
```

---

## 5. 🤖 Automated CI/CD Pipeline (`.github/workflows/cicd.yml`)

The deployment workflow is fully automated via GitHub Actions on every push to `main`.

```
[ Git Push to main ]
         │
         ▼
[ 1. Validate Job ] ──► Synthesizes compose template & runs `docker compose config`
         │
         ▼
[ 2. Build Job ] ────► Builds & pushes `bhiv/abhiruchi-backend` & `bhiv/abhiruchi-frontend` to Docker Hub
         │
         ▼
[ 3. Deploy Job ] ───► SSH into VM ──► Extract bundle ──► Pull images ──► docker compose up -d
         │
         ├───► [ Healthcheck Loop (12 attempts) ]
         │            │
         │            ├───► SUCCESS ──► Record release in docs/RELEASE_HISTORY.md
         │            │
         │            └───► FAILURE ──► Trigger Rollback Job
         │
         ▼
[ 4. Rollback Job ] ─► Fetches last healthy SHA tag from RELEASE_HISTORY.md ──► Redeploys & Verifies
```

---

## 6. 🔑 Required GitHub Actions Secrets

Configure the following secrets in GitHub Repository Settings (`Settings` -> `Secrets and variables` -> `Actions`):

| Secret Key | Description | Example / Required Value |
| :--- | :--- | :--- |
| `DOCKER_USERNAME` | Docker Hub username / org | `bhiv` |
| `DOCKER_PASSWORD` | Docker Hub Personal Access Token | `dckr_pat_...` |
| `VM_IP` | Target VM public / private IP address | `123.45.67.89` |
| `VM_PORT` | SSH port for remote host | `22` |
| `VM_USERNAME` | SSH username | `ubuntu` / `admin` |
| `VM_PASSWORD` | SSH user password | `...` |
| `ABHIRUCHI_BACKEND_ENV_FILE` | Complete `server/.env` contents for production | Multi-line text |
| `ABHIRUCHI_FRONTEND_ENV_FILE`| Complete `client/.env` contents for production | Multi-line text |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/gurukul_assessment` |
| `GROQ_API_KEY` | Groq API Key | `gsk_...` |
| `VITE_API_BASE_URL` | Public / VM API Base URL | `http://<VM_IP>:5004/api` |
| `VITE_GROK_API_KEY` | Groq Key for Frontend build | `gsk_...` |

---

## 7. 🩺 Health Check Endpoints & Live Verification

### 7.1 Backend API Health Endpoint
- **URL**: `GET http://<HOST>:5004/api/health`
- **Expected Status**: `200 OK`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "message": "Gurukul Assessment MERN API Server is operational",
    "timestamp": "2026-09-05T12:11:28.000Z"
  }
  ```

### 7.2 Frontend Application Verification
- **URL**: `GET http://<HOST>:5179/`
- **Expected Status**: `200 OK` (Serves React single page application)

### 7.3 CLI Verification on VM
```bash
# Check running container health status
docker inspect --format='{{.State.Health.Status}}' abhiruchi-backend-prod
docker inspect --format='{{.State.Health.Status}}' abhiruchi-frontend-prod

# Inspect logs
docker compose -f ~/abhiruchi/docker-compose.production.yml logs --tail=50
```

---

## 8. 🔄 Rollback Procedures

### 8.1 Automated Rollback
If any deployment health check fails during the CI/CD pipeline, the `rollback` job automatically executes:
1. Queries `docs/RELEASE_HISTORY.md` for the last recorded `SUCCESS` or `ROLLBACK_SUCCESS` commit tag.
2. Injects the stable tag into `docker-compose.production.yml`.
3. Pulls and restarts the stable containers.
4. Validates health checks and writes `ROLLBACK_SUCCESS` to the ledger.

### 8.2 Manual Rollback SOP
To manually roll back to a specific known image tag on the production VM:

```bash
ssh -p <VM_PORT> <VM_USER>@<VM_IP>
cd ~/abhiruchi

# 1. Inspect previous tags in release history
cat docs/RELEASE_HISTORY.md

# 2. Render compose file with target tag (e.g., abc1234)
sed "s|IMG_TAG|abc1234|g" docker-compose.production.template.yml > docker-compose.production.yml

# 3. Pull target tag and restart
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d --remove-orphans

# 4. Verify health
docker compose -f docker-compose.production.yml ps
curl -I http://localhost:5004/api/health
curl -I http://localhost:5179/
```

---

## 9. 🛠️ Troubleshooting Runbook

| Issue | Potential Cause | Resolution |
| :--- | :--- | :--- |
| **Backend 502 / Connection Refused** | MongoDB connection failed or wrong `MONGODB_URI` | Inspect backend logs via `docker logs abhiruchi-backend-prod`. Verify MongoDB host/port connectivity. |
| **CORS Errors in Browser** | `CORS_ORIGIN` missing frontend origin | Add the frontend domain/IP (e.g. `http://<VM_IP>:5179`) to `CORS_ORIGIN` in `server/.env`. |
| **Frontend blank page / 404 on sub-routes** | Static file server missing SPA fallback | Verify `serve -s dist -l 5173` is active in `client/Dockerfile` (the `-s` flag enables SPA fallback). |
| **Groq AI Evaluation Failures** | Missing or invalid `GROQ_API_KEY` | Verify key validity and ensure key is prefixed with `gsk_`. |
| **Port Conflict on Host** | Port `5004` or `5179` occupied | Modify `BACKEND_PORT` or `FRONTEND_PORT` in `.env` / `docker-compose.production.template.yml`. |
