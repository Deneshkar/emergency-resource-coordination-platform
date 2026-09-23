# Emergency Resource Coordination Platform - Frontend

React + Vite frontend for the Emergency Resource Coordination Platform.

## Environment Variables

For local development, create a `.env` file:

```
VITE_API_URL=http://localhost:5009
```

For production (Vercel), set the environment variable:

```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set root directory to `frontend-react`
4. Add environment variable: `VITE_API_URL` = your Railway backend URL
5. Deploy!
