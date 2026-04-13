# Deploy NotebookLM (Vercel + Render)

## 1) Deploy backend on Render

- Create a new **Web Service** from this repo.
- Set **Root Directory** to `backend`.
- Build command:

```bash
pip install -r requirements.txt
```

- Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

- Add environment variables in Render:
  - `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`
  - Optional (for preview deployments):
    - `CORS_ALLOW_ORIGIN_REGEX=https://.*\.vercel\.app`

- Deploy and copy your backend URL (example: `https://your-api.onrender.com`).

## 2) Deploy frontend on Vercel

- Import this repo into Vercel as a new project.
- Set **Root Directory** to `frontend`.
- Add environment variable:
  - `NEXT_PUBLIC_API_BASE_URL=https://<your-render-backend-domain>`
- Deploy.

## 3) Verify end-to-end

- Open Vercel URL.
- Create notebook.
- Add source and test chat.
- If requests fail with CORS, confirm Render `CORS_ALLOWED_ORIGINS` exactly matches your Vercel domain.
