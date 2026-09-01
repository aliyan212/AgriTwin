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
| Tests | ❌ None |
| Migrations / deployment packaging | ❌ create_all only; no Alembic, no Dockerfiles for app services |
| Background data ingestion | ❌ Data only persists when someone loads a farm — no scheduler |
| Sentinel-2 hi-res imagery | ⚠️ Stubbed, needs credentials |

## Small Wins (high value, low effort)

1. **Fix dead nav links** — header links to `/farms` and `/docs`, but only `/farms/[id]` exists; both 404 today. Point Docs at the backend's `:8000/docs`.
2. **Wire auth end-to-end** — everything exists; just add `Depends(get_current_user)` to farm/intelligence routes and drop the `user_id=1` hardcode. Half a day, biggest credibility jump.
3. **Add a smoke-test suite** — pytest + FastAPI TestClient: health check, register/login, farm CRUD, and a mocked intelligence call. Even ~10 tests transform hackathon code into maintainable code.
4. **Add `.env.example` files** (backend + frontend) and make `SECRET_KEY` required — it's currently a hardcoded default with `DEBUG=True`.
5. **Auto-derive growth stage from sowing date** — `crop_knowledge.py` already has days_after_sowing tables; compute the stage instead of relying on manual entry.
6. **Dockerize the full stack** — add backend/frontend Dockerfiles to docker-compose so `docker compose up` runs everything, not just the DB.
7. **Introduce Alembic** (or at minimum a documented `DATABASE_URL` switch) to close the SQLite-dev / PostGIS-prod gap — geometry is currently stored as a string in dev.

## Bigger Suggestions

1. **Scheduled ingestion (APScheduler/Celery):** snapshot weather + NDVI daily per farm. This is the single highest-leverage change — the ML engine and history pages get dramatically better as real labels accumulate without user visits.
2. **Alert delivery channels:** SMS/WhatsApp (e.g. Twilio) — Punjab farmers won't check a web dashboard; push the alerts to them.
3. **Urdu localization of recommendations and UI** — the system prompt already targets "simple language for a farmer"; bilingual output is a natural next step.
4. **Forecast validation loop:** periodically compare ML score forecasts vs. realized scores and surface accuracy in the UI — builds trust and tunes the model.
5. **PWA/offline support** for low-connectivity rural use.
6. **Sentinel-2 activation** for 10 m field-level zoning (detect stressed zones within a field) once credentials are configured — the service layer is already structured for it.
