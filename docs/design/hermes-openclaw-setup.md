# Setup Guide — OpenClaw + Hermes cho use case AI-native

**Tài liệu cài đặt & cấu hình** cho ngăn xếp: **Telegram → OpenClaw (gateway) → Hermes (brain) →
domain tools (Creative Factory / Professional Services) → n8n (đăng bài/lịch)**, với **knowledge base
đúng chuẩn** thay cho Google Drive.

> **Lưu ý về tính chính xác:** các lệnh cài đặt bên dưới dựa trên tài liệu chính thức tại thời điểm
> soạn (OpenClaw `docs.openclaw.ai`; Hermes `hermes-agent.nousresearch.com`, bản v0.7.0 — 03/04/2026).
> Hai công cụ này cập nhật nhanh — **luôn đối chiếu lệnh với tài liệu chính thức** (liên kết ở §12)
> trước khi chạy trên máy thật. Chỗ `<...>` là giá trị bạn tự điền.

---

## 0. Bạn đang dựng cái gì

```
 Telegram (và Discord/Slack/WhatsApp…)
        │  tin nhắn / lệnh / nút Approve-Reject
        ▼
 ┌──────────────────────┐   OpenClaw = GATEWAY (self-hosted)
 │ OpenClaw Gateway      │   nối chat app ↔ agent; định tuyến; pairing
 └──────────┬───────────┘
            │  tác vụ phức tạp
            ▼
 ┌──────────────────────┐   Hermes = BRAIN (self-improving)
 │ Hermes Agent          │   skills + memory + learning loop
 │  • MCP server mode ───┼──▶ gọi domain tools qua MCP
 │  • pluggable memory ──┼──▶ KB đúng chuẩn (KHÔNG phải Drive)
 └──────────┬───────────┘
            │
   ┌────────┴─────────┐
   ▼                  ▼
 Domain tools       n8n (đăng X/FB/IG/TikTok, lịch, retry)
 • Creative Factory (HTTP/MCP)
 • Professional Services skills (L4)
```

**Nguyên tắc:** OpenClaw *định tuyến*, Hermes *suy nghĩ + học*, domain tools *sản xuất có kiểm soát*,
n8n *chạy bước cơ học cố định*. Con người *duyệt* trước khi phát hành.

---

## 1. Yêu cầu trước khi cài (Prerequisites)

| Hạng mục | Chi tiết |
| --- | --- |
| **Máy chủ** | 1 VPS/Linux (hoặc máy cá nhân) chạy 24/7 cho OpenClaw Gateway + Hermes. Docker + Docker Compose khuyến nghị. |
| **Node.js** | OpenClaw installer tự cài; hoặc cài sẵn LTS. |
| **API keys LLM** | Anthropic / OpenAI / OpenRouter (BYO), hoặc **Nous Portal** (300+ model). |
| **Telegram Bot** | Tạo bot qua `@BotFather` → lấy **bot token**. |
| **Datastore cho KB** | Postgres + `pgvector` (khuyến nghị, đồng bộ với Creative Factory). Tùy chọn: Neo4j (GraphRAG từ repo professional-services). |
| **n8n** | Bản self-host (Docker) hoặc n8n cloud. |
| **2 repo domain** | `creative-factory-v2` (creative) và/hoặc `ai-native-professional-services` (L1–L6 brain pattern). |

---

## 2. Vai trò từng thành phần (nhắc lại ngắn)

| Thành phần | Vai trò | Nguồn |
| --- | --- | --- |
| **OpenClaw** | Gateway đa kênh, self-host, pairing Telegram | `docs.openclaw.ai` |
| **Hermes** | Brain: skills + holographic memory + learning loop + MCP mode | `hermes-agent.nousresearch.com` |
| **Creative Factory** | Nhà máy nội dung deterministic + QA/brand gate | repo này |
| **Professional Services** | Mẫu L1–L6: skills + eval gate + memory + GraphRAG | `ai-native-professional-services` |
| **n8n** | Đăng bài, lịch, retry, connector social | self-host |
| **KB (Postgres/pgvector [+Neo4j])** | Bộ nhớ dài hạn chung | — |

---

## 3. Phần A — Cài Hermes (Brain)

### 3.1 Cài đặt

Theo trang chính thức `hermes-agent.nousresearch.com` — có **desktop app** hoặc **terminal**:

```bash
# Cài qua terminal (đối chiếu lệnh chính xác trên trang chính thức)
# Sau khi cài:
hermes                 # mở giao diện TUI
hermes model           # chọn provider (Anthropic / OpenAI / OpenRouter / Nous Portal)
```

Cấu hình key (BYO) — dùng biến môi trường:

```bash
export ANTHROPIC_API_KEY="<claude-key>"      # hoặc
export OPENAI_API_KEY="<openai-key>"         # hoặc OPENROUTER_API_KEY / Nous Portal
```

### 3.2 Cấu hình bộ nhớ (điểm mấu chốt — thay Google Drive)

Hermes v0.7.0 dùng **holographic memory** (fact-based, SQLite + FTS5) và hỗ trợ **pluggable memory
backends**. Chiến lược:

- **Mặc định (working + episodic ngắn hạn):** để nguyên SQLite/FTS5 của Hermes — nhanh, cục bộ.
- **Dài hạn / semantic / chia sẻ nhiều agent:** trỏ pluggable backend sang **Postgres + pgvector**
  (đồng bộ với Creative Factory). Đây là "system of record" chung.
- **Đồ thị quan hệ (nếu cần suy luận chuỗi sở hữu/quy định như repo professional-services):** thêm
  **Neo4j GraphRAG** làm tầng L1.
- **Google Drive → hạ xuống "hộp thư nguồn":** không phải KB; chỉ là nơi bỏ tài liệu thô, rồi
  **ingest** (chunk → embed) vào pgvector.

> Ánh xạ 4 loại memory của repo professional-services vào đây:
> | Loại (repo L2) | Backend đề xuất |
> | --- | --- |
> | **Working** | Hermes SQLite (mặc định) / Redis |
> | **Episodic** | Postgres event store (Creative Factory đã có) |
> | **Semantic** | pgvector (`knowledge_chunk`) |
> | **Procedural** | Skills của Hermes (§3.4) + bảng `agent_skill` |

### 3.3 Bật MCP server mode (nối domain tools)

Hermes v0.7.0 có **MCP server mode** — đây là seam sạch để Hermes gọi Creative Factory và các skill:

```bash
# Bật Hermes ở chế độ MCP (đối chiếu cờ chính xác trên docs)
hermes mcp            # hoặc cấu hình trong file config của Hermes
```

Khai báo các MCP tool trỏ tới domain:

- `creative_factory.run_pipeline` → gọi HTTP API `POST /runs` của repo này (xem §5).
- `creative_factory.submit_review_decision` → duyệt/loại tại chốt.
- `professional_services.<skill>` → gọi các skill L4 (sanctions-screen, ubo-chain-traverse…).

### 3.4 Định nghĩa Skills theo mẫu L4 (framework "brain")

Port đúng cấu trúc skill từ repo `ai-native-professional-services` (đây là phần "framework/skills"
bạn muốn). Mỗi skill gồm **manifest + eval suite + gate**:

```
skills/
  SKILL_<ten-skill>.md         # mục đích, input, output, dependencies
  EVAL_<ten-skill>.json        # ≥10 test case xác định, ngưỡng pass 0.90–1.00
run_evals.py                   # cổng kiểm định: fail → exit≠0, chặn regression
.github/workflows/eval-gate.yml
```

Ví dụ skill cho use case creative:

- `SKILL_brief-from-message.md` — biến tin nhắn Telegram tự do → Business Brief đúng schema.
- `SKILL_caption-write.md` — viết caption theo brand voice.
- `SKILL_qa-interpret.md` — đọc verdict QA của Creative Factory → chỉ dẫn recompile.

**Nguyên tắc bất di bất dịch (từ governance của repo mẫu):** không skill nào lên production nếu chưa
đạt eval gate; **không hành động phát hành nào chạy trước khi con người duyệt**.

---

## 4. Phần B — Cài OpenClaw (Gateway)

### 4.1 Cài đặt

Theo `docs.openclaw.ai` — hỗ trợ **local** (macOS/Windows/Linux, tự cài Node.js + deps) hoặc **Docker**:

```bash
# Cách 1 — Docker (khuyến nghị cho server 24/7)
# Cần Docker + Docker Compose; dùng setup script chính thức của OpenClaw.

# Cách 2 — cài trực tiếp rồi onboard
openclaw onboard                 # thiết lập có hướng dẫn + pairing
openclaw gateway install         # cài systemd service (chạy nền)
# → Installed systemd service: ~/.config/systemd/user/openclaw-gateway.service
```

### 4.2 Cấu hình

Toàn bộ cấu hình nằm ở **`~/.openclaw/openclaw.json`** (API keys, gateway settings, connection prefs):

```jsonc
// ~/.openclaw/openclaw.json  (minh họa — đối chiếu schema chính thức)
{
  "channels": {
    "telegram": { "botToken": "<telegram-bot-token>", "enabled": true }
  },
  "agent": {
    // Định tuyến tác vụ phức tạp sang Hermes (qua MCP / lệnh agent)
    "provider": "hermes",
    "endpoint": "<hermes-mcp-endpoint>"
  }
}
```

### 4.3 Pair Telegram

Chạy pairing flow của OpenClaw để gắn bot Telegram; sau đó nhắn thử bot để xác nhận Gateway phản hồi.

---

## 5. Phần C — Nối Creative Factory làm domain tool

Repo này cần lộ pipeline ra (mục **INT-1/INT-2/INT-5** trong `PRD.md`). Tối thiểu:

```
POST /runs                     # nhận Business Brief → chạy pipeline
GET  /runs/{id}                # trạng thái + summary
GET  /runs/{id}/events (SSE)   # stream event: tới chốt duyệt thì báo ra
POST /runs/{id}/review         # nhận quyết định duyệt/loại
```

Hermes gọi các endpoint này qua MCP tool `creative_factory.*`. Khi run tới `ASSET_REVIEW`/
`FINAL_APPROVAL`, event SSE → OpenClaw → gửi **preview + nút Approve/Reject** về Telegram.

> Chưa có sẵn — cần build (xem `docs/design/target-architecture.md` §S16). Có thể dùng provider stub
> để chạy thử luồng trước khi cắm AI thật.

---

## 6. Phần D — n8n (đăng bài, lịch, retry)

- **Trigger:** node lắng nghe event `export.published` từ Creative Factory (webhook/SSE bridge), hoặc
  Cron cho lịch định kỳ.
- **Social nodes:** X / Facebook / Instagram / TikTok / LinkedIn — nạp credential từng kênh.
- **Báo lại:** sau khi đăng, gọi ngược Telegram (qua OpenClaw) đính link bài đã đăng.

> Phân vai rõ để tránh chồng chéo: **OpenClaw** cho kênh *chat*; **n8n** cho *social media + lịch +
> SaaS*. Đừng để cả hai cùng đăng một chỗ.

---

## 7. Phần E — Knowledge base wiring (thay Drive)

```bash
# Postgres + pgvector (dùng chung với Creative Factory)
# 1) Bật extension
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2) Bảng semantic + skill (Hermes ghi/đọc)
#   knowledge_chunk(id, source, content, embedding vector, metadata jsonb)
#   agent_skill(id, name, definition jsonb, score, last_run_date)
#   user_preference(id, user_id, key, value jsonb)
```

- **Ingest Drive → pgvector:** một job (n8n hoặc script) đọc tài liệu mới trên Drive → chunk → embed
  (`text-embedding-3-small` hoặc tương đương) → ghi `knowledge_chunk`. Drive chỉ là *nguồn*.
- **Neo4j (tùy chọn):** nếu cần suy luận đồ thị (mẫu L1 của repo professional-services), chạy pipeline
  6 bước `ingest → extract → resolve → load → embed → validate`.

---

## 8. Skills & Eval Gate — "não" có kỷ luật

Đây là phần khiến agent *đáng tin*: mọi skill của Hermes đi qua cổng kiểm định như repo mẫu.

```bash
python run_evals.py                    # chạy toàn bộ suite, fail → exit≠0
python run_evals.py --skill caption-write
python run_evals.py --write            # lưu current_score + last_run_date
```

Gán vào CI (`.github/workflows/eval-gate.yml`): mỗi push/PR chạy gate; skill dưới ngưỡng → chặn merge.
→ Hermes "càng dùng càng giỏi" nhưng **không tự ý thả skill kém** ra production.

---

## 9. Kiểm thử end-to-end (smoke test)

1. Nhắn bot Telegram: _"Làm 3 post IG cho Northwind, tông xanh, deadline thứ 6."_
2. OpenClaw nhận → định tuyến sang Hermes.
3. Hermes dùng `SKILL_brief-from-message` → Business Brief; gọi `creative_factory.run_pipeline`.
4. Pipeline chạy tới `ASSET_REVIEW` → SSE → OpenClaw gửi preview + nút **Approve/Reject** về Telegram.
5. Bấm **Approve** → `export.published` → n8n đăng → báo link về Telegram.
6. Kiểm tra: Hermes có ghi episodic/semantic memory vào Postgres không (để lần sau brief tốt hơn).

---

## 10. Bảo mật & guardrail

- Không commit key vào repo; dùng biến môi trường / secret manager.
- **Human-in-the-loop bắt buộc** trước mọi hành động phát hành (đăng bài, gửi client) — nguyên tắc
  #3 của repo mẫu: _"Agents draft; humans review and send."_
- Không cho agent tự đăng khi chưa qua QA + review gate.
- Audit trail bất biến: giữ event store + quyết định review để truy vết.
- Giới hạn quyền: OpenClaw/n8n credential theo nguyên tắc tối thiểu.

---

## 11. Checklist biến môi trường

```bash
# LLM
ANTHROPIC_API_KEY= / OPENAI_API_KEY= / OPENROUTER_API_KEY=   # hoặc Nous Portal
# Telegram
TELEGRAM_BOT_TOKEN=
# KB
DATABASE_URL=postgres://...        # có pgvector
NEO4J_URI= NEO4J_USER= NEO4J_PASSWORD=   # (tùy chọn)
EMBEDDING_MODEL=text-embedding-3-small
# Domain
CREATIVE_FACTORY_API_URL=
# n8n
N8N_WEBHOOK_URL=
```

---

## 12. Nguồn chính thức (bắt buộc đối chiếu)

- OpenClaw docs — https://docs.openclaw.ai/
- OpenClaw — personal assistant setup — https://docs.openclaw.ai/start/openclaw
- OpenClaw GitHub — https://github.com/openclaw/openclaw
- Hermes Agent (Nous Research) — trang chính thức: `hermes-agent.nousresearch.com`
- Hermes Agent developer guide (bên thứ ba) — https://lushbinary.com/blog/hermes-agent-developer-guide-setup-skills-self-improving-ai/
- Hermes vs OpenClaw (bối cảnh) — https://engineeratheart.medium.com/hermes-agent-an-openclaw-alternative-with-memory-skills-and-a-real-learning-loop-e9ab7e2b4b84

---

## 13. Việc còn phải làm (không bịa)

- **Xác minh lệnh CLI chính xác** của OpenClaw & Hermes trên tài liệu chính thức (phiên bản đổi nhanh).
- **Build INT-1/2/5** ở Creative Factory (`apps/api`) — hiện mới có `/health`.
- **Quyết định memory backend** dài hạn: pgvector-only hay thêm Neo4j.
- **Port skills L4** (manifest + eval) từ repo professional-services sang Hermes cho domain creative.
- **Chốt taxonomy kênh social + credential** trong n8n.

---

*Hết — Setup Guide OpenClaw + Hermes.*
