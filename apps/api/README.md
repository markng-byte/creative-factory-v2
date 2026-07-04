# FastAPI API

FastAPI application for the Enterprise AI Creative Factory.

## Development

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn creative_factory_api.main:app --reload --port 8000
```

## Tests

```bash
pytest
```
