# Automation Integration — Creative Factory ↔ Telegram · OpenClaw · Hermes · n8n

**Status:** Design (pre-implementation). Tài liệu này chốt **các giao diện tích hợp** để đưa Creative
Factory vào luồng tự động: HTTP API (`POST /runs`…), **MCP tool-manifest** cho Hermes, **workflow n8n**
mẫu, và luồng **Telegram approve/reject**. Đây là bản thực thi của §11 trong `PRD.md` và Phần C/D của
`hermes-openclaw-setup.md`.

> Mọi tên DTO, event, và trạng thái lifecycle bên dưới là **thật** (từ `packages/contracts` và
> `packages/domain`). Endpoint là **cần build** (S16) — hiện `apps/api` mới có `/health`.

---

## 1. Sơ đồ luồng (rút gọn)

```
Telegram ──▶ OpenClaw (gateway) ──▶ Hermes (brain, MCP client)
                                        │  gọi tool creative_factory.*
                                        ▼
                              Creative Factory API (S16)
                              POST /runs ─▶ pipeline.run()
                                        │  events (SSE)
              ┌─────────────────────────┤
              ▼ (tới *_REVIEW)          ▼ (export.published)
   OpenClaw→Telegram: Approve/Reject     n8n: đăng social + báo lại Telegram
              │
              ▼ POST /runs/{id}/review
```

---

## 2. HTTP API (S16) — hợp đồng

Base: `/{apiVersion}` · Auth: `Authorization: Bearer <token>` · Lỗi: `ApiErrorResponse`.

### 2.1 `POST /runs` — khởi động một run

Nhận brief (hoặc tham chiếu brief đã có) và chạy pipeline.

**Request**

```jsonc
{
  "brief": {
    // BusinessBriefDto (packages/contracts/src/api.ts)
    "objective": "Ra mắt dòng Insight Q3",
    "audience": "SME chủ doanh nghiệp 30–45",
    "channels": ["instagram", "tiktok"],
    "constraints": ["tông xanh", "không dùng người thật"]
  },
  "brandId": "brand-northwind",
  "campaignId": "campaign-northwind-q3", // optional; tạo mới nếu thiếu
  "validationMode": "STRICT", // ValidationMode
  "seed": "northwind", // optional; deterministic
  "idempotencyKey": "<uuid>" // optional; chống chạy trùng
}
```

**Response `202 Accepted`**

```jsonc
{
  "runId": "run_01J...",
  "campaignId": "campaign-northwind-q3",
  "lifecycleState": "STRATEGY_DRAFT", // CampaignLifecycleState
  "eventsUrl": "/runs/run_01J.../events"
}
```

### 2.2 `GET /runs/{runId}` — trạng thái + summary

```jsonc
{
  "runId": "run_01J...",
  "campaignId": "campaign-northwind-q3",
  "lifecycleState": "ASSET_REVIEW",
  "summary": {
    "scenes": 6,
    "shots": 13,
    "assetsGenerated": 26,
    "assetsApproved": 26,
    "assetsPlanned": 33,
    "qa": "PASS",
    "passRate": 1.0,
    "eventCount": 89,
    "completed": false
  },
  "openReview": {
    // có mặt khi đang chờ người ở một gate
    "reviewCycleId": "rc_01J...",
    "targetKind": "assets" // strategy | storyboard | assets | final
  }
}
```

### 2.3 `GET /runs/{runId}/events` — SSE stream

Server-Sent Events; mỗi message là một event contract thật. Dùng để biết **khi nào tới chốt duyệt** và
**khi nào published**.

```
event: campaign.lifecycle.transitioned
data: {"runId":"run_01J...","from":"ASSET_GENERATION_RUNNING","to":"ASSET_REVIEW","sequence":72}

event: qa.completed
data: {"runId":"run_01J...","overall":"PASS","passRate":1.0,"sequence":70}

event: export.published
data: {"runId":"run_01J...","bundleId":"bnd_01J...","sequence":88}
```

Tên event hợp lệ: `prompt.generated` · `asset.generated` · `qa.completed` · `asset.cataloged` ·
`export.published` · `campaign.lifecycle.transitioned` · `review.completed`. Client gửi
`Last-Event-ID` (= `sequence`) để resume.

### 2.4 `POST /runs/{runId}/review` — quyết định tại gate

```jsonc
{
  // ReviewDecisionRequest
  "reviewCycleId": "rc_01J...",
  "decision": "APPROVE", // APPROVE | REQUEST_CHANGES | REJECT | ESCALATE
  "rationale": "Đạt brand, duyệt.",
  "reviewer": "tg:user:12345" // ai bấm nút trên Telegram
}
```

`REQUEST_CHANGES` kèm `rationale` → engine đưa feedback có cấu trúc vào **recompile** (IR version mới).

### 2.5 Bảng tóm tắt

| Method & path            | Mục đích                        | Trả về / hiệu ứng                 |
| ------------------------ | ------------------------------- | --------------------------------- |
| `POST /runs`             | Khởi động run                   | `202` + `runId`                   |
| `GET /runs/{id}`         | Trạng thái + summary            | lifecycle + counters + openReview |
| `GET /runs/{id}/events`  | SSE event stream                | luồng event resume được           |
| `POST /runs/{id}/review` | Duyệt/loại/đổi tại gate         | transition + (recompile nếu cần)  |
| `GET /health`            | Healthcheck (đã có)             | `HealthResponse`                  |

---

## 3. MCP tool-manifest cho Hermes

Hermes (MCP client) gọi Creative Factory như các tool. Manifest tối thiểu:

```jsonc
{
  "name": "creative-factory",
  "version": "0.1.0",
  "tools": [
    {
      "name": "run_pipeline",
      "description": "Chạy pipeline Creative Factory từ một Business Brief; trả runId + eventsUrl.",
      "inputSchema": {
        "type": "object",
        "required": ["brief", "brandId"],
        "properties": {
          "brief": {
            "type": "object",
            "required": ["objective", "audience", "channels"],
            "properties": {
              "objective": { "type": "string" },
              "audience": { "type": "string" },
              "channels": { "type": "array", "items": { "type": "string" } },
              "constraints": { "type": "array", "items": { "type": "string" } }
            }
          },
          "brandId": { "type": "string" },
          "campaignId": { "type": "string" },
          "seed": { "type": "string" }
        }
      }
    },
    {
      "name": "get_run",
      "description": "Lấy trạng thái + summary + openReview của một run.",
      "inputSchema": {
        "type": "object",
        "required": ["runId"],
        "properties": { "runId": { "type": "string" } }
      }
    },
    {
      "name": "submit_review_decision",
      "description": "Gửi quyết định tại một human gate.",
      "inputSchema": {
        "type": "object",
        "required": ["runId", "reviewCycleId", "decision"],
        "properties": {
          "runId": { "type": "string" },
          "reviewCycleId": { "type": "string" },
          "decision": {
            "type": "string",
            "enum": ["APPROVE", "REQUEST_CHANGES", "REJECT", "ESCALATE"]
          },
          "rationale": { "type": "string" }
        }
      }
    }
  ]
}
```

> Mỗi tool ánh xạ 1–1 với một endpoint ở §2. Hermes tự quyết *khi nào* gọi; **QA + human gate của
> repo là lan can** giữ agent không vượt rào.

---

## 4. Workflow n8n mẫu

Hai workflow: (A) khởi động từ Telegram; (B) đăng bài khi published.

### 4.1 Workflow A — Telegram → run + gửi nút duyệt

```jsonc
{
  "name": "cf-telegram-intake",
  "nodes": [
    { "name": "Telegram Trigger", "type": "n8n-nodes-base.telegramTrigger", "parameters": {} },
    {
      "name": "Ask Hermes (build brief)",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "method": "POST", "url": "={{$env.HERMES_URL}}/brief-from-message" }
    },
    {
      "name": "Start Run",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "={{$env.CREATIVE_FACTORY_API_URL}}/runs",
        "jsonBody": "={{ { brief: $json.brief, brandId: $json.brandId } }}",
        "sendBody": true
      }
    },
    {
      "name": "Wait For Review (SSE/poll)",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.CREATIVE_FACTORY_API_URL}}/runs/{{$json.runId}}"
      }
    },
    {
      "name": "Send Approve/Reject Buttons",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "operation": "sendMessage",
        "text": "Run {{$json.runId}} tới gate {{$json.openReview.targetKind}} — duyệt?",
        "additionalFields": {
          "reply_markup": {
            "inline_keyboard": [
              [
                { "text": "✅ Approve", "callback_data": "approve:{{$json.openReview.reviewCycleId}}" },
                { "text": "🔴 Reject", "callback_data": "reject:{{$json.openReview.reviewCycleId}}" }
              ]
            ]
          }
        }
      }
    }
  ]
}
```

### 4.2 Workflow B — callback duyệt → tiếp tục, và published → đăng

```jsonc
{
  "name": "cf-review-and-publish",
  "nodes": [
    { "name": "Telegram Callback", "type": "n8n-nodes-base.telegramTrigger", "parameters": { "updates": ["callback_query"] } },
    {
      "name": "Submit Decision",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "={{$env.CREATIVE_FACTORY_API_URL}}/runs/{{$json.runId}}/review",
        "jsonBody": "={{ { reviewCycleId: $json.cycleId, decision: $json.decision, reviewer: $json.from } }}",
        "sendBody": true
      }
    },
    {
      "name": "On export.published → Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "url": "={{$env.CREATIVE_FACTORY_API_URL}}/runs/{{$json.runId}}" }
    },
    { "name": "Instagram", "type": "n8n-nodes-base.instagram", "parameters": {} },
    { "name": "TikTok", "type": "n8n-nodes-base.httpRequest", "parameters": {} },
    {
      "name": "Notify Telegram (đã đăng)",
      "type": "n8n-nodes-base.telegram",
      "parameters": { "operation": "sendMessage", "text": "Đã đăng {{$json.links}}" }
    }
  ]
}
```

> Đây là **khung minh họa** — tên node/tham số cần đối chiếu phiên bản n8n thật. `callback_data` mã hóa
> `decision:cycleId`; parse ở node kế để dựng payload `POST /review`.

---

## 5. Luồng Telegram approve/reject (chi tiết)

```
1. Người nhắn brief ─▶ OpenClaw/n8n ─▶ POST /runs ─▶ runId
2. SSE: lifecycle → ASSET_REVIEW  (openReview.reviewCycleId, targetKind="assets")
3. Bot gửi: preview + [✅ Approve] [🔴 Reject]   (inline keyboard, callback_data=decision:cycleId)
4a. Approve ─▶ POST /runs/{id}/review {decision:"APPROVE"} ─▶ lifecycle tiến tiếp
4b. Reject  ─▶ POST /runs/{id}/review {decision:"REQUEST_CHANGES", rationale} ─▶ recompile (IR mới)
5. Lặp cho FINAL_APPROVAL ─▶ export.published ─▶ n8n đăng ─▶ báo link về Telegram
```

**Ai là reviewer:** map Telegram user id → `reviewer` trong `ReviewDecisionRequest` để lưu vào audit
trail. `[placeholder: cơ chế phân quyền — ai được phép Approve?]`

---

## 6. Ánh xạ event → hành động

| Event                              | Hành động ngoài                                    |
| ---------------------------------- | -------------------------------------------------- |
| `campaign.lifecycle.transitioned` → `*_REVIEW`/`FINAL_APPROVAL` | Gửi nút Approve/Reject về Telegram |
| `qa.completed` (FAIL)              | Báo Telegram + để Hermes diễn giải → recompile     |
| `export.published`                 | Kích n8n đăng social                                |
| `review.completed`                 | Cập nhật thread Telegram (đã duyệt/loại)            |
| `asset.generated`                  | (tùy chọn) cập nhật tiến độ                         |

---

## 7. Bảo mật & idempotency

- **Auth:** Bearer token cho API; secret cho webhook n8n; validate Telegram update.
- **Idempotency:** `POST /runs` nhận `idempotencyKey`; callback duyệt chống double-submit theo
  `reviewCycleId` (một cycle chỉ đóng một lần).
- **Human-in-the-loop bắt buộc** trước `export.published` — không đăng khi chưa qua QA + review.
- **Audit:** mọi quyết định ghi kèm `reviewer` + rationale vào event store.

---

## 8. Việc cần build (không bịa)

- **S16:** `POST /runs`, `GET /runs/{id}`, `GET /runs/{id}/events` (SSE), `POST /runs/{id}/review`
  trong `apps/api` (hiện chỉ `/health`).
- **MCP server** phơi tool-manifest §3 (hoặc adapter để Hermes gọi REST).
- **Hermes skill** `brief-from-message` (+ eval) — xem `hermes-openclaw-setup.md` §3.4.
- **n8n workflows** A/B — hoàn thiện theo phiên bản n8n thật.
- **`[placeholder]`:** phân quyền reviewer, taxonomy kênh, credential social.

---

## 9. Liên quan

- `PRD.md` §11 — bối cảnh tích hợp tự động.
- `hermes-openclaw-setup.md` — cài đặt OpenClaw + Hermes + KB.
- `target-architecture.md` — lớp API (S16) & persistence (S15).
- `database-design.md` — event store / IR snapshot (nền cho SSE + audit).

---

_Hết — Automation Integration._
