Demo frontend para la hackathon de La Virginia.

## Desarrollo local

Variables necesarias:

```bash
cp .env.example .env.local
```

```bash
BACKEND_URL=http://127.0.0.1:3000
VALIDATOR_API_KEY=validator-dev-key
```

Arranque:

```bash
npm install
npm run dev
```

La pagina principal:
- permite subir foto o usar camara
- manda la imagen a `POST /api/inspect`
- Next reenvia la imagen al backend Node sin exponer la API key al navegador

## Produccion con Docker

El proyecto esta preparado para imagen standalone:

```bash
docker build -t lavirginia-frontend .
```

Para el stack completo en VPS, usar el compose de:

```bash
../hackathon-lavirginia-backend/deploy/vps
```

Ese deploy levanta:
- `frontend`
- `backend`
- `python-model`
- `postgres`
- `caddy` con HTTPS

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Notas

- en un VPS remoto, la camara del navegador requiere `https`
- el backend productivo queda oculto detras del proxy de Next y Caddy
