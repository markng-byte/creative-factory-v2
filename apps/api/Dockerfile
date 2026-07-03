# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

FROM base AS builder
RUN pip install --no-cache-dir hatchling
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip wheel --no-cache-dir --wheel-dir /wheels .

FROM base AS runner
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl && rm -rf /wheels
USER app
EXPOSE 8000
ENV HOST=0.0.0.0
ENV PORT=8000
CMD ["uvicorn", "creative_factory_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
