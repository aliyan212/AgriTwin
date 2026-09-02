# Roadmap

## How Much Has Been Achieved

Roughly 75–80% of a working MVP — impressively complete:

| Area | Status |
| ---- | ------ |
| Real data integrations (Open-Meteo, NASA POWER, MODIS, air quality) | ✅ Done, with caching & provenance |
| Health scoring engine + alerts + crop knowledge | ✅ Done, rule-based, explainable |
| Per-farm ML score forecasting | ✅ Done, incl. bootstrap labeling |
| AI recommendations (Gemini + fallback) | ✅ Done, history-grounded |
| Full dashboard UI + farm detail/history pages | ✅ Done |
| JWT auth (backend + login page + token-aware API client) | ⚠️ Built but not enforced — farm endpoints hardcode user_id=1 (farms.py) |
| Tests | ✅ Done (Pytest + FastAPI TestClient + Node translation tests + GitHub Actions CI) |
| Migrations / deployment packaging | ✅ Done — Alembic initialized with initial_schema & PostGIS documentation |
| Background data ingestion | ❌ Data only persists when someone loads a farm — no scheduler |
| Sentinel-2 hi-res imagery | ⚠️ Stubbed, needs credentials |

## Small Wins (high value, low effort)

1. **Fix dead nav links** — ✅ Done: `/farms` Hub page added, API Docs pointed directly at Swagger `:8000/docs`.
2. **Wire auth end-to-end** — everything exists; just add `Depends(get_current_user)` to farm/intelligence routes and drop the `user_id=1` hardcode. Half a day, biggest credibility jump.
3. **Add a smoke-test suite** — ✅ Done: Pytest + TestClient suite covering health, JWT auth, farm CRUD, AgriCore 5-dimension scoring, phenology calculation, bilingual Punjabi recommendations, and GitHub Actions CI.
4. **Add `.env.example` files** — ✅ Done: `backend/.env.example` and `frontend/.env.example` added with documentation.
5. **Auto-derive growth stage from sowing date** — ✅ Done: `crop_knowledge.derive_growth_stage` computes exact stage and DAS from knowledge tables.
6. **Dockerize the full stack** — add backend/frontend Dockerfiles to docker-compose so `docker compose up` runs everything, not just the DB.
7. **Introduce Alembic** (or at minimum a documented `DATABASE_URL` switch) — ✅ Done: Alembic migrations configured, versioned initial schema, and `DATABASE_SETUP.md` documentation added.

## Bigger Suggestions

1. **Scheduled ingestion (APScheduler/Celery):** snapshot weather + NDVI daily per farm. This is the single highest-leverage change — the ML engine and history pages get dramatically better as real labels accumulate without user visits.
2. **Alert delivery channels:** SMS/WhatsApp (e.g. Twilio) — Punjab farmers won't check a web dashboard; push the alerts to them.
3. **Punjabi / Rural Urdu localization of recommendations and UI** — ✅ Done: Bilingual Punjabi engine (`text_ur`, `reasoning_ur`), interactive language toggle (`EN` | `پنجابی`), authentic crop phenology & agrometeorological terminology, Noto Nastaliq Urdu typography, and RTL support.
4. **Forecast validation loop:** periodically compare ML score forecasts vs. realized scores and surface accuracy in the UI — builds trust and tunes the model.
5. **PWA/offline support** for low-connectivity rural use.
6. **Sentinel-2 activation** for 10 m field-level zoning (detect stressed zones within a field) once credentials are configured — the service layer is already structured for it.
