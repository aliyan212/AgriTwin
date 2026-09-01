# Contributing to AgriTwin AI

Thank you for your interest in contributing to **AgriTwin AI**! We welcome contributions to help modernize precision agriculture in Pakistan.

---

## 🛠️ Development Setup

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/aliyan212/AgriTwin.git
   cd AgriTwin
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   alembic upgrade head
   PYTHONPATH=../data-engine uvicorn app.main:app --reload
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

---

## 🌾 Adding New Crops to the Knowledge Base

To add or update crop phenology, water demands, or pest profiles:
1. Open `data-engine/crop_knowledge.py`.
2. Add a new entry to `CROP_KNOWLEDGE_BASE` with the provincial sowing window, optimal temperatures, and growth stages with Days After Sowing (DAS).
3. Add the corresponding Punjabi translations in `frontend/src/lib/translations.ts` in `cropNameTranslationMap` and `stageTranslationMap`.

---

## 🌐 Updating Punjabi Translations

All translations are centralized in `frontend/src/lib/translations.ts`:
- Ensure agricultural terms reflect authentic Punjab vocabulary (*اگاؤ, شگوفے, گنڈھ, گوپھ, بور, دانہ بھرائی, کٹائی, ہاڑی, ساؤنی*).
- Keep translations crisp, friendly, and easy to understand for local farmers.

---

## 🧪 Coding Standards

- **Backend**: Python 3.11+, typed FastAPI endpoints with Pydantic v2 schemas.
- **Frontend**: Next.js 14 App Router, TypeScript strict mode, Tailwind CSS with semantic dark/light classes.
- **Database Migrations**: Always generate new revisions with Alembic (`alembic revision --autogenerate -m "description"`).

---

## 📜 Pull Requests

1. Create a feature branch (`git checkout -b feature/my-feature`).
2. Commit changes with clear, descriptive commit messages (`git commit -m "feat: add mustard crop phenology"`).
3. Push to your branch and open a Pull Request against `main`.
