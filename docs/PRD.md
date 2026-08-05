# PRD — Creative Factory

**Tài liệu Yêu cầu Sản phẩm (Product Requirements Document)**

| | |
| --- | --- |
| **Sản phẩm** | Creative Factory — nền tảng sản xuất sáng tạo tự động, provider-neutral, deterministic |
| **Repo** | `creative-factory-v2` |
| **Phiên bản tài liệu** | 1.0 |
| **Ngày** | 2026-08-05 |
| **Trạng thái code** | Engine spine hoàn tất (Sprint 0–14). Lớp ngang (API/UI/persistence/ingestion) đang ở giai đoạn thiết kế (S15–S18). |
| **Mục đích tài liệu** | Mô tả đầy đủ sản phẩm hiện có + phần còn thiếu, làm cơ sở trước khi đưa vào luồng tự động (n8n / agent tự hành). |

---

## 1. Tóm tắt điều hành (Executive Summary)

Creative Factory biến **một bản brief kinh doanh/sáng tạo** thành **một chiến dịch hoàn chỉnh, đã kiểm duyệt, đã publish và đã phân tích** — với mọi bước review, verdict QA, provenance, phiên bản asset và bản export đều được ghi vào **một mô hình dữ liệu chuẩn duy nhất**.

Nguyên tắc nền tảng:

```
Business Brief → Creative IR → Production Outputs        (KHÔNG BAO GIỜ: Brief → Prompts thẳng)
```

Mọi thành phần sáng tạo được biểu diễn dưới dạng **Creative Intermediate Representation (Creative IR)** — một mô hình versioned, máy đọc được, mà **mọi engine đều tiêu thụ và tạo ra**. 13 engine bao quanh trục IR này; không engine nào phụ thuộc vào nội bộ của engine khác, và **không engine nào gắn cứng với một nhà cung cấp AI** — sự phụ thuộc provider bị cô lập vào 2 "seam" (điểm nối) rõ ràng: **dịch prompt** và **publish**.

Kết quả: toàn hệ thống **tái lập được từng byte** (byte-for-byte reproducible), **test được hoàn toàn offline**, và có thể cắm provider AI/publish thật vào sau seam mà không đổi phần còn lại.

---

## 2. Vấn đề & Cơ hội

**Vấn đề.** Sản xuất nội dung sáng tạo quy mô lớn hiện nay thường:

- Nhảy thẳng từ "ý tưởng" sang "prompt cho AI", làm mất tính nhất quán thương hiệu và không thể audit.
- Không tái lập được: cùng một brief cho ra kết quả khác nhau mỗi lần.
- Không có chốt kiểm duyệt con người có cấu trúc → nội dung lệch brand vẫn lọt ra.
- Gắn chặt vào một provider AI cụ thể → khó thay đổi, khó test.

**Cơ hội.** Một "dây chuyền sản xuất" xác định (deterministic) với:

- Một mô hình dữ liệu trung tâm (Creative IR) làm nguồn sự thật.
- Kiểm soát chất lượng + thương hiệu tự động trước khi phát hành.
- Chốt duyệt của con người tại các điểm trọng yếu.
- Tính trung lập với nhà cung cấp để dễ nâng cấp/thay thế.

---

## 3. Mục tiêu & Chỉ số

### 3.1 Mục tiêu sản phẩm

| # | Mục tiêu | Cách đo |
| --- | --- | --- |
| G1 | Từ brief → chiến dịch hoàn chỉnh trong một lần chạy | `pipeline.run()` trả về campaign page + dashboard |
| G2 | Tái lập tuyệt đối | Cùng input + seed → output giống hệt từng byte |
| G3 | Nhất quán thương hiệu được đảm bảo trước khi phát hành | QA engine cho verdict PASS/FAIL trên nội dung thật |
| G4 | Con người kiểm soát tại điểm trọng yếu | 4 chốt review, "request changes" → recompile |
| G5 | Trung lập nhà cung cấp | Đổi provider = thêm adapter sau seam, không sửa engine |
| G6 | Mọi thứ đều audit được | Event stream + IR snapshot versioned |

### 3.2 Chỉ số thành công (minh họa qua ví dụ "Northwind")

Một lần chạy thật (`node scripts/demo.mjs`, seed `northwind`) cho ra — **các con số này được TÍNH, không hard-code**:

- **Cấu trúc:** 6 scene · 13 shot
- **Asset:** 26 tạo · 26 duyệt / 33 kế hoạch
- **QA:** PASS, tỉ lệ đạt 100%
- **Export:** 1 bundle published, lifecycle `COMPLETED`
- **Sự kiện:** 89 event trong toàn bộ run

---

## 4. Người dùng & Personas

> `[placeholder: cần xác thực bằng nghiên cứu người dùng thật]`

| Persona | Mô tả | Quan tâm chính |
| --- | --- | --- |
| **Strategist / Producer** (chính) | Sở hữu chiến dịch đầu-cuối: nộp brief, chọn tài liệu tham chiếu, ra quyết định tại chốt, xuất bản | Run đang ở đâu · đang chờ gì ở mình · QA đạt chưa |
| **Reviewer / Brand lead** (phụ) | Chỉ tham gia ra quyết định tại chốt duyệt | Nội dung có đúng brand không |
| **Admin** (phụ) | `[placeholder: phạm vi — cấu hình brand, user, connector?]` | Cấu hình hệ thống |
| **Hệ thống tự động** (n8n/agent) | Gọi pipeline qua API/tool, không phải người | Interface ổn định, có thể trigger + lấy kết quả |

---

## 5. Phạm vi

### 5.1 Trong phạm vi (đã có — Sprint 0–14)

- Compile Brief → Creative IR → Creative Package (storyboard, scene/shot spec, timeline, QA spec).
- Dịch IR → prompt package (image / video / voiceover) trung lập provider.
- Sinh ảnh & video (provider **deterministic offline**, cắm được provider thật).
- QA thương hiệu trên nội dung asset thật.
- Thư viện asset content-addressed (versioning, chống trùng, tái sử dụng).
- Export → production package + trang chiến dịch hoàn chỉnh (HTML) + seam publish.
- Analytics + khuyến nghị tối ưu + dashboard.
- 4 chốt review của con người + đưa feedback có cấu trúc vào recompile.
- Orchestrator chạy toàn bộ trong một lời gọi.
- Event stream contract đầy đủ (thu thập trong bộ nhớ).

### 5.2 Ngoài phạm vi hiện tại (còn thiếu — S15–S18)

- **Persistence thật:** mọi state đang sau **in-memory port**. Postgres + Redis đã khai báo trong docker-compose nhưng **chưa có code kết nối**. Chưa có ORM/schema/migration.
- **API HTTP:** `apps/api` mới có `/health`. Chưa engine nào lộ ra HTTP.
- **Web console:** `apps/web` mới là scaffold. Chưa có form brief, upload, hay trình xem run.
- **Provider AI thật:** provider ảnh/video là **stub deterministic** (SVG/SMIL), chưa gọi diffusion/TTS thật.
- **Upload & phân tích tài liệu tham chiếu:** reference mới là **con trỏ metadata** (URL + mô tả); chưa upload/lưu/phân tích byte thật.
- **Đăng social media:** chưa có. (Có khái niệm "publish seam" trong export-engine nhưng chưa có adapter social.)

### 5.3 Không phải mục tiêu (Non-goals)

- Không tự huấn luyện mô hình AI.
- Không thay thế công cụ tự động hóa (n8n) hay agent — repo là **engine + hàng rào** được các công cụ đó gọi.
- Không phải mạng xã hội hay công cụ lên lịch — việc đăng bài do lớp tích hợp bên ngoài đảm nhận (xem §11).

---

## 6. Nguyên tắc kiến trúc

1. **Creative IR là trục trung tâm.** Mọi engine đọc/ghi IR; không đi tắt từ brief sang prompt.
2. **Deterministic.** Thời gian và ID được tiêm vào (fixed clock + seeded id generator) → tái lập từng byte.
3. **Provider-neutral qua port/seam.** Coupling provider chỉ ở 2 seam: dịch prompt & publish; mặc định là bản offline deterministic.
4. **Immutable + content-addressed.** IR snapshot bất biến theo version; asset định địa chỉ theo nội dung (sha256) → chống trùng & tái sử dụng.
5. **Event-sourced.** Mọi bước phát event contract; event stream là bản ghi audit và nền tảng cho replay/streaming.
6. **Thay port, không sửa engine.** Mọi nâng cấp hạ tầng (DB, blob, provider, social) là "thêm adapter sau port có sẵn".

---

## 7. Yêu cầu chức năng (Functional Requirements)

Ký hiệu: **FR-x**. Trạng thái: ✅ đã có · 🟡 một phần · ⬜ chưa có.

### 7.1 Nạp đầu vào (Ingestion)
- **FR-1** ✅ Nạp Business Brief → Creative Brief (`business-brief-importer`, `campaign-engine`).
- **FR-2** ✅ Nạp brand tokens/bundle (`brand-*` packages: importer, tokenizer, validator, registry).
- **FR-3** 🟡 Reference/asset tham chiếu đi vào IR như metadata (`creative-ir-compiler/stages/context.ts`); ⬜ chưa upload/phân tích byte thật.

### 7.2 Compile
- **FR-4** ✅ Compile Brief + Campaign + Brand → Creative IR (`creative-ir-compiler`).
- **FR-5** ✅ Sinh Creative Package: storyboard, scene/shot spec, timeline, QA spec (`creative-ir-adapters`).
- **FR-6** ✅ Recompile từ feedback review có cấu trúc.

### 7.3 Dịch prompt
- **FR-7** ✅ IR → prompt package trung lập provider cho image/video/voiceover (`prompt-translation`).
- **FR-8** ✅ Seam dispatch provider dịch prompt (mặc định offline deterministic).

### 7.4 Sinh asset
- **FR-9** ✅ Sinh ảnh từ prompt (`image-generation`, provider deterministic).
- **FR-10** ✅ Sinh video/clip động (`video-generation`, provider deterministic).
- **FR-11** ⬜ Cắm provider AI thật (diffusion/TTS) sau seam.
- **FR-12** ✅ Ghi asset output ngược lại IR kèm provenance.

### 7.5 Kiểm soát chất lượng
- **FR-13** ✅ QA thương hiệu trên nội dung asset thật, cho verdict + ghi `qaStatus` vào IR (`qa-engine`).

### 7.6 Thư viện asset
- **FR-14** ✅ Catalog content-addressed; version chain bất biến; chống trùng; nhận diện tái sử dụng chéo chiến dịch (`asset-library`).

### 7.7 Export & Publish
- **FR-15** ✅ Đóng gói production + trang chiến dịch hoàn chỉnh (HTML self-contained) (`export-engine`).
- **FR-16** ✅ Seam publish → event `export.published` → lifecycle `COMPLETED`.
- **FR-17** ⬜ Adapter publish ra kênh social (X/FB/IG/LinkedIn/TikTok) — điểm mở rộng cho luồng tự động.

### 7.8 Analytics
- **FR-18** ✅ Báo cáo analytics vòng đời + khuyến nghị tối ưu + dashboard HTML (`analytics-engine`).

### 7.9 Review & Workflow
- **FR-19** ✅ 4 chốt review con người: strategy / storyboard / assets / final (`review-engine`).
- **FR-20** ✅ Comment neo vào node IR cụ thể; mức độ nghiêm trọng (blocking/major/minor); chuỗi phê duyệt đa cấp.
- **FR-21** ✅ Đóng cycle → workflow transition + event + feedback có cấu trúc → recompile.
- **FR-22** ✅ Máy trạng thái vòng đời chiến dịch (`workflow-engine`).

### 7.10 Orchestration
- **FR-23** ✅ Chạy toàn bộ pipeline trong một lời gọi `createPipeline().run()` (`pipeline`).

### 7.11 Interface (lớp ngang — chưa có)
- **FR-24** ⬜ Lộ pipeline & engine qua HTTP API (hiện chỉ `/health`).
- **FR-25** ⬜ Web console: brief form, upload, trình xem run trực tiếp, màn duyệt.
- **FR-26** ⬜ Persistence thật (Postgres event store + IR snapshot + indices; Redis; blob store).
- **FR-27** ⬜ Trigger/webhook để hệ thống ngoài khởi động run.

---

## 8. Vòng đời & Luồng sự kiện

### 8.1 Trạng thái vòng đời (thật, từ `packages/domain`)

```
DRAFT → BRIEF_READY → STRATEGY_DRAFT → STRATEGY_REVIEW → STORYBOARD_DRAFT
→ STORYBOARD_REVIEW → PROMPT_READY → ASSET_GENERATION_PENDING
→ ASSET_GENERATION_RUNNING → ASSET_REVIEW → FINAL_APPROVAL → EXPORTING → COMPLETED
      (+ CANCELLED)
```

Bốn chốt `*_REVIEW` / `FINAL_APPROVAL` là điểm chờ con người.

### 8.2 Event contract (thật, từ `packages/contracts/src/events.ts`)

`prompt.generated` · `asset.generated` · `qa.completed` · `asset.cataloged` ·
`export.published` · `campaign.lifecycle.transitioned` · `review.completed`

Event stream là nền tảng cho audit, replay, và streaming run trực tiếp lên console/hệ thống ngoài.

---

## 9. Yêu cầu phi chức năng (Non-Functional Requirements)

| # | Yêu cầu | Trạng thái |
| --- | --- | --- |
| **NFR-1 Determinism** | Cùng input + seed → output giống hệt từng byte | ✅ có test đầu-cuối |
| **NFR-2 Testability** | Chạy & test hoàn toàn offline, không cần API ngoài | ✅ |
| **NFR-3 Provider isolation** | Coupling provider chỉ ở 2 seam | ✅ |
| **NFR-4 Auditability** | Mọi bước có event + provenance; IR snapshot versioned | ✅ (in-memory) → ⬜ (bền vững) |
| **NFR-5 Chất lượng code** | CI xanh: TypeScript, Prettier, Python; coverage ≥ 80% | ✅ |
| **NFR-6 Khả năng mở rộng** | Thêm hạ tầng = thêm adapter sau port | ✅ theo thiết kế |
| **NFR-7 Bảo mật/Tenancy** | Đa tenant, phân quyền | `[placeholder: chưa thiết kế]` |
| **NFR-8 Hiệu năng/SLA** | Thời gian chạy, đồng thời, queue | `[placeholder: chưa đặt mục tiêu]` |

---

## 10. Mô hình dữ liệu & Persistence (thiết kế S15)

Chi tiết trong `docs/design/database-design.md`. Tóm tắt:

- **Postgres** — nguồn sự thật: `event` (append-only), `ir_snapshot` (bất biến, versioned), `campaign`/`brief`, `library_asset(_version)`, `review_cycle` + con, `material`, `export`.
- **Blob store** — byte ảnh/video/upload thật, content-addressed (local dev, S3 prod), sau interface `AssetStore`.
- **Redis** — chỉ ephemeral: run queue, tín hiệu chờ chốt, lock, cache.
- **Port → bảng:** mọi bảng đứng sau một interface đã tồn tại (`*Source`, `AssetLibrary`, `AssetStore`, `ReviewRegistry`) → **không sửa engine**.

---

## 11. Điểm tích hợp cho luồng tự động (n8n / agent tự hành)

> Phần này chuẩn bị cho bước kế tiếp của bạn: hook → gen ảnh/video + caption → auto post.

### 11.1 Những gì cần bổ sung để tích hợp
- **INT-1** ⬜ Lộ `pipeline.run()` qua HTTP API (S16) — để n8n/agent gọi được.
- **INT-2** ⬜ Endpoint trigger/webhook nhận sự kiện khởi động run (INT với "hook" đầu luồng).
- **INT-3** ⬜ Cắm provider ảnh/video thật sau seam dịch prompt (thay stub).
- **INT-4** ⬜ Adapter publish social sau seam publish của `export-engine` — HOẶC ủy quyền việc đăng cho n8n.
- **INT-5** ⬜ Streaming event ra ngoài (SSE) để hệ thống ngoài theo dõi tiến độ.

### 11.2 Vai trò của repo trong hai kiểu luồng

| | **Với n8n (khai báo)** | **Với agent tự hành (OpenClaw)** |
| --- | --- | --- |
| Repo là gì | Một service **được gọi** qua HTTP | Một bộ **tool + hàng rào** agent gọi |
| Repo lo | Sinh nội dung + QA + brand + versioning + audit | Như trên + **phanh** giữ agent không đăng lệch brand/chưa duyệt |
| Bên ngoài lo | Trigger, credential social, fan-out kênh, retry | Suy luận động, chọn bước, ứng biến |
| Chốt duyệt | Map với node Wait/approval của n8n | Map với tool "gate", agent phải chờ |
| Giá trị cốt lõi repo mang lại | Kỷ luật sản xuất, tái lập, kiểm duyệt | Deterministic + QA gate làm lan can cho agent |

Điểm chung: dù n8n, agent hay lai, repo là **lớp tạo nội dung có kiểm soát**; cắm vào bên nào cũng là "thêm adapter", không viết lại engine.

---

## 12. Roadmap (lớp ngang còn lại)

| Sprint | Nội dung | Trạng thái |
| --- | --- | --- |
| **S15** | Persistence & event store (Postgres/Redis/blob sau port) | Thiết kế xong (`database-design.md`) |
| **S16** | API gateway — lộ pipeline & engine qua HTTP | Thiết kế (`target-architecture.md`) |
| **S17** | Ingestion — upload + phân tích tài liệu tham chiếu thật | Thiết kế |
| **S18** | Web console (Next.js) — brief/upload/run/review/deliverables | Thiết kế (`ux-ui-spec.md`) |
| **(mở rộng)** | Provider AI thật + adapter publish social | Chưa lên lịch — điểm tích hợp luồng tự động |

---

## 13. Tiêu chí chấp nhận (Acceptance Criteria)

- **AC-1** `node scripts/demo.mjs` chạy đầu-cuối, xuất trang chiến dịch + dashboard vào `.demo-output/`.
- **AC-2** Chạy lại cùng seed cho output giống hệt (determinism test xanh).
- **AC-3** CI xanh toàn bộ: TypeScript, Prettier, Python; coverage ≥ 80%.
- **AC-4** "Request changes" tại một chốt → recompile phản ánh feedback trong IR mới.
- **AC-5** QA cho verdict PASS/FAIL dựa trên nội dung asset thật, ghi vào IR.
- **AC-6** (cho lớp ngang) Sau S15–S16: một run được ghi bền vững và replay được từ event store; gọi được qua HTTP.

---

## 14. Rủi ro & Giả định

| Loại | Nội dung |
| --- | --- |
| **Giả định** | Provider AI thật cắm được sau seam mà không phá determinism ở phần còn lại (phần provider có thể phi-deterministic, được cô lập). |
| **Giả định** | Việc đăng social do lớp ngoài (n8n) hoặc adapter publish đảm nhận — repo cung cấp nội dung + gate. |
| **Rủi ro** | Cắm provider thật làm mất tái lập nếu không cô lập kỹ ở seam. |
| **Rủi ro** | Agent tự hành có thể đăng nội dung lệch brand nếu bỏ qua QA/review gate → **bắt buộc đi qua gate**. |
| **Rủi ro** | Các `[placeholder]` về tenancy, retention, SLA chưa chốt → cần quyết trước khi lên prod. |

---

## 15. Phụ lục

### 15.1 Danh mục package (thật)

**Engine (S5–S14):** `creative-ir-compiler`, `creative-ir-adapters`, `review-engine`, `prompt-translation`, `image-generation`, `video-generation`, `qa-engine`, `asset-library`, `export-engine`, `analytics-engine`, `pipeline`.

**Nền tảng (S2–S4):** `domain`, `contracts`, `shared-kernel`, `workflow-engine`, `creative-ir`, `creative-brief`, `audience-model`, `messaging-engine`, `campaign-engine`, `campaign-registry`, `brand-engine`, `brand-importers`, `brand-tokenizer`, `brand-validator`, `brand-registry`, `business-brief-importer`, `env-config`.

**App:** `apps/api` (FastAPI, `/health`), `apps/web` (scaffold Next.js).

**Cấu hình chung:** `eslint-config`, `prettier-config`, `tsconfig`.

### 15.2 Tài liệu liên quan trong repo
- `docs/pipeline-overview.md` — bản đồ đầu-cuối.
- `docs/design/target-architecture.md` — kiến trúc lớp ngang tiếp theo.
- `docs/design/ux-ui-spec.md` — đặc tả UX/UI console.
- `docs/design/database-design.md` — thiết kế CSDL/persistence.
- `docs/roadmap.md` — lịch sử từng sprint.
- `docs/examples/` — artifact ví dụ Northwind (mở HTML trong trình duyệt).

### 15.3 Ghi chú về `[placeholder]`
Các mục `[placeholder]` là quyết định chưa chốt (tenancy, retention, SLA, taxonomy kênh, phạm vi admin…). Cần giải quyết trước khi lên production, không ảnh hưởng tính đúng đắn của engine hiện tại.

---

*Hết PRD — Creative Factory v1.0.*
