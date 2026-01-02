# Prism Cloud Lite · 术语表（Glossary）

本文用于统一前后端与文档中的核心名词，避免同一概念多种叫法导致对接/排障成本上升；同时也为后续 RAG 入库提供“稳定词表”。

## 1. 领域术语

| 术语 | 英文/别名 | 一句话解释 | 相关文档 |
|---|---|---|---|
| 平台 | Platform | Prism Cloud Lite Web + API + 服务端能力的总称 | `docs/overview/project-overview.md` |
| 设备 | Device / Player | 终端播放设备（硬件播放器），与平台保持在线、接收指令、上报状态 | `docs/modules/devices/README.md` |
| 配对 | Pairing | 用户把“自己账号下的一台设备”绑定到平台的过程（常用短码/一次性码） | `docs/modules/devices/README.md` |
| 素材 | Asset / Media | 视频/图片/文本等媒体内容，通常先上传 OSS 再落库 | `docs/modules/media-library/README.md` |
| 素材库 | Media Library | 素材的上传、去重、落库与管理能力集合 | `docs/modules/media-library/README.md` |
| 节目 | Program | “播什么”的抽象：由若干素材与布局/组件组成，可被发布到设备 | `docs/modules/program-and-schedule/README.md` |
| 排程 | Schedule | “什么时候播什么”的规则集合：时间窗、优先级、重复规则等 | `docs/modules/program-and-schedule/README.md` |
| 发布 | Publish / Deployment / Release | 把节目/排程的最新状态下发到设备，使设备端配置生效 | `docs/modules/program-and-schedule/README.md` |
| VSN | — | 设备侧识别/加载节目文件的描述格式（历史/兼容层） | `docs/modules/program-and-schedule/vsn-info.md` |

## 2. 指令/通知相关

| 术语 | 英文/别名 | 一句话解释 | 相关文档 |
|---|---|---|---|
| 动作 | Action | 面向 SPA 的稳定请求模型（例如“设置亮度”“发布节目”） | `docs/specs/device-commands-actions.md` |
| 指令 | Command | 面向 device-service/设备侧的执行载体（包含 url/method/body/ttl 等） | `docs/specs/device-commands-actions.md` |
| 操作 | Operation | 面向用户体验的可追踪语义（DISPATCHED/ACKED/SUCCEEDED…），建议与 commandId 关联 | `docs/specs/realtime-notifications-sse.md` |
| SSE | Server-Sent Events | 浏览器到网关的单向实时推送通道（EventSource + Cookie） | `docs/specs/realtime-notifications-sse.md` |
| 通知事件 | Notification | core 产出、gateway 转发给 SPA 的 UI 驱动事件（notify.#） | `docs/specs/realtime-notifications-sse.md` |

## 3. 接口分层与路径

| 名词 | 含义 | 相关文档 |
|---|---|---|
| 对外 API | 浏览器/外部客户端访问的 API，由 gateway 对外提供 | `docs/overview/env-local-dev-and-prod.md` |
| 业务 API | core-service 面向 SPA 的业务接口，统一前缀 `/api/v1/**` | `docs/overview/env-local-dev-and-prod.md` |
| 认证 API | auth-service 认证中心能力，统一前缀 `/auth/**`（经由 gateway 转发） | `docs/overview/env-local-dev-and-prod.md` |
| 内部 API | 服务间调用接口（如 `/internal/**`），不对外暴露 | `docs/overview/env-local-dev-and-prod.md` |

