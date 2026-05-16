# Conexión Front ↔ Backend

## Arquitectura

```
Browser (Next.js)
    │
    │  POST /api/validator/validate-package
    │  Header: x-api-key: <VALIDATOR_API_KEY>
    │  Body: multipart/form-data { image: File }
    ▼
Backend Node (Railway)
    │
    ├─ POST /v1/inspect → Python FastAPI (Railway, red privada)
    │                     Modelo CNN: ok | defective
    │
    └─ POST AI Gateway  → Kimi / GPT-4o (multimodal)
                          Devuelve APROBADO | RECHAZADO + 3 ejes
    │
    ▼
Browser recibe PackageValidatorResult
```

---

## Variables de entorno del front

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_VALIDATOR_API_KEY=tu-validator-api-key
```

| Variable | Dónde conseguirla |
|---|---|
| `NEXT_PUBLIC_API_URL` | Railway → tu servicio Node → Settings → Public domain |
| `NEXT_PUBLIC_VALIDATOR_API_KEY` | Railway → tu servicio Node → Variables → `VALIDATOR_API_KEY` |

> **Nota**: Al tener prefijo `NEXT_PUBLIC_`, estas variables quedan expuestas en el bundle del cliente. Para el hackathon está bien ya que el panel es interno.

---

## Variables de entorno del backend (Railway)

El backend necesita estas variables configuradas en Railway → Service → Variables:

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Auto-generada por el plugin PostgreSQL de Railway |
| `JWT_SECRET` | ✅ | String largo aleatorio (ej: `openssl rand -hex 32`) |
| `VALIDATOR_API_KEY` | ✅ | Clave que el front manda como `x-api-key`. Inventala vos |
| `AI_GATEWAY_URL` | ✅ | URL del AI Gateway (ej: `https://api.opencode.go/v1/chat/completions`) |
| `AI_GATEWAY_API_KEY` | ✅ | API key del AI Gateway |
| `AI_GATEWAY_MODEL` | opcional | Default: `gpt-4o-mini`. Ej: `opencode-go/kimi-k2.6` |
| `ADMIN_EMAIL` | opcional | Email del usuario admin inicial. Default: `mateoyastor60@gmail.com` |
| `PYTHON_MODEL_URL` | opcional | URL del servicio Python. Si no está, el validador continúa sin él |

---

## Setup en Railway (paso a paso)

### 1. Crear el proyecto

1. Entrá a [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo → seleccioná `hackathon-lavirginia-backend`
3. Railway detecta el `Dockerfile` automáticamente

### 2. Agregar PostgreSQL

1. En tu proyecto Railway → Add Service → Database → PostgreSQL
2. Railway genera `DATABASE_URL` automáticamente y la inyecta en el servicio Node

### 3. Configurar variables

Railway → tu servicio Node → Variables → Add Variable:

```
JWT_SECRET=<openssl rand -hex 32>
VALIDATOR_API_KEY=lavirginia-hackathon-2026
AI_GATEWAY_URL=https://...
AI_GATEWAY_API_KEY=sk-...
AI_GATEWAY_MODEL=opencode-go/kimi-k2.6
ADMIN_EMAIL=tu@email.com
```

### 4. Deploy

Railway buildea el Dockerfile automáticamente con cada push a `main`. El CMD del container hace:
1. `prisma db push` — sincroniza el schema con la DB
2. `seed` — crea el usuario admin si no existe
3. `node dist/server.js` — levanta el servidor

### 5. Obtener la URL pública

Railway → tu servicio Node → Settings → Networking → Generate Domain

Esa URL va en `NEXT_PUBLIC_API_URL` del front.

---

## Conexión con el servicio Python (opcional)

Si deployás el servicio Python (`capsule_qc_mvp`) como un segundo servicio en el **mismo proyecto** Railway:

1. Railway le asigna un nombre interno, por ejemplo `capsule-qc`
2. Configurá en el servicio Node:
   ```
   PYTHON_MODEL_URL=http://capsule-qc.railway.internal:8000
   ```
3. El backend Node llama al Python internamente antes de llamar al AI Gateway

Si el Python no está disponible o responde 503, el validador continúa normalmente usando solo el AI Gateway (hay fallback implementado).

---

## Flujo de una validación

```
Usuario sube imagen en el panel
    │
    ▼
lib/api.ts → validatePackage(file)
    │  POST /api/validator/validate-package
    │  x-api-key: VALIDATOR_API_KEY
    │  body: FormData { image: file }
    │
    ▼
validator.controller.ts → validatePackageHandler()
    │
    ├─ [opcional] callPythonModel() → Python /v1/inspect
    │   └─ Devuelve: { status, confidence, defects }
    │      Si falla → null (continúa igual)
    │
    └─ AI Gateway (multimodal)
        Imagen en base64 + output del modelo Python
        └─ Devuelve JSON estructurado
    │
    ▼
Respuesta al front:
{
  "decision": "APROBADO" | "RECHAZADO",
  "approved": true | false,
  "confidence": 0.95,
  "reason": "package_looks_correct",
  "secondary_reasons": [],
  "observations": ["La cápsula está en buen estado"],
  "validator_summary": "...",
  "failed_axes": {
    "capsule_damage": false,    → Eje 2
    "capsule_disorder": false,  → Eje 3
    "packaging_damage": false   → Eje 1
  },
  "image_quality": "good"
}
    │
    ▼
InspectionPanel muestra resultado
RecentInspectionsSection agrega fila a la tabla
```

---

## Test local

1. Levantá el backend:
   ```bash
   cd hackathon-lavirginia-backend
   cp .env.example .env   # completar variables
   npm run dev            # corre en puerto 3000
   ```

2. Configurá el front:
   ```bash
   cd hackathon-v0-lavirginia-front
   echo 'NEXT_PUBLIC_API_URL=http://localhost:3000' > .env.local
   echo 'NEXT_PUBLIC_VALIDATOR_API_KEY=lavirginia-hackathon-2026' >> .env.local
   npm run dev            # corre en puerto 3001 si 3000 está ocupado
   ```

3. Abrí el panel → "Subir imagen" → seleccioná un JPG/PNG de una cápsula
