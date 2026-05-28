# MedXVision - Multi-Disease Detection in Medical Imaging
using Deep Learning and Explainable AI

Production-ready starter for an explainable AI radiology platform using NIH ChestXray14.

## Features
- JWT authentication (signup/login)
- NORMAL vs ABNORMAL prediction API
- 14-disease multi-label probabilities
- Grad-CAM visualization endpoint integration
- PDF report generation
- Patient prediction history
- Analytics endpoint (accuracy, precision, recall, F1)

## Folder Structure
- `frontend/` React + Tailwind dashboard
- `backend/` FastAPI + SQLite + auth + inference APIs
- `ml/` model training and experimentation scripts
- `docs/` architecture/deployment notes

## Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Dataset Integration
1. Download NIH dataset and metadata CSV.
2. Place files under `dataset/`:
   - `dataset/sample_labels.csv`
   - `dataset/images/`
3. Update paths in `ml/training/train_models.py` if needed.

## Training
```bash
cd ml/training
python train_models.py --dry-run
python train_models.py --mode both --epochs 6 --batch-size 16
```
Then place generated models in `backend/app/model_store/`.

## API Endpoints
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/predictions/analyze`
- `GET /api/v1/predictions`
- `GET /api/v1/predictions/{id}`
- `GET /api/v1/analytics`

## Database Schema
### users
- id (PK)
- full_name
- email (unique)
- hashed_password

### predictions
- id (PK)
- user_id (FK)
- status
- severity
- top_disease
- probabilities_json
- gradcam_path
- created_at

## Deployment
- Backend: Render/Fly.io/EC2 with `uvicorn app.main:app`
- Frontend: Vercel/Netlify
- Set `VITE_API_URL` to deployed backend URL
- Store `SECRET_KEY` in environment variables

## Important Notes
- Current training script is a complete scaffold with TODOs for your local 5GB dataset pipeline.
- API currently uses fallback predictions if trained models are absent.
- Add medically validated thresholding and external evaluation before clinical use.
