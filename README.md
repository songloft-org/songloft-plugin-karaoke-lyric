# songloft-plugin-karaoke-lyric

卡拉 OK 歌词刮削插件，从多个平台自动刮削歌词并关联入库。  
宿主版本要求 `>= 2.0.0`。

## 歌词源

| 源 | 标识 | 歌词类型 | 特殊依赖 |
|---|---|---|---|
| 小秋 | `qm` | 逐行 / 逐字 | TripleDES + QMC1 解密 |
| 小枸 | `kg` | 逐行 / 逐字 | XOR 解密 + zlib 解压 |
| 小芸 | `ne` | 逐行 / 逐字 | eapi 加解密（AES-ECB） |
| Lrclib | `lrclib` | 逐行 | 无加密 |

## 功能

- **搜索** — 跨源搜索歌曲，返回匹配结果及评分
- **获取** — 指定源和歌曲信息获取歌词（原文 / 翻译 / 罗马音 / 逐字）
- **刮削** — 自动遍历所有源，按评分取最优结果
- **关联** — 将歌词写入 Songloft 曲库
- **批量刮削** — 勾选多首歌曲一键批量操作
- **歌词编辑** — 时间偏移、倒计时、繁简转换
- **Web 控制台** — 歌曲列表、搜索预览、接口测试、设置信息

## 命令

```bash
npm run build      # prebuild（同步版本）→ 构建插件输出 dist/
npm run dev        # 开发模式
npm run validate   # 验证 plugin.json 配置
```

版本以 `package.json` 为唯一数据源，构建时自动同步到 `plugin.json`、`package-lock.json`、`src/version.ts`。

## HTTP API

### `GET /info`

返回插件信息（版本、许可、仓库等）。

### `GET /search?title=xxx&artist=xxx&duration=xxx`

跨源搜索歌曲，返回匹配结果及评分。

### `POST /fetch`

指定源获取歌词。

```json
{ "source": "qm", "title": "...", "artist": "...", "duration": 0 }
```

### `POST /scrape`

自动遍历源刮削最优歌词。

```json
{ "title": "...", "artist": "...", "duration": 0 }
```

### `POST /open-scrape`

对外公开接口，需 `Authorization: Bearer <token>` 认证。

```json
{ "title": "...", "artist": "...", "duration": 0, "source": "qm" }
```

### `POST /attach`

将歌词关联到指定曲库歌曲。

```json
{ "song_id": 1, "lyric": "...", "tlyric": "...", "rlyric": "..." }
```

### `GET /songs`

获取曲库中有关联歌词的歌曲列表（支持分页、搜索、无歌词过滤）。

## 项目结构

```
src/
  main.ts              # 插件入口（onInit / onDeinit / onHTTPRequest）
  router.ts            # HTTP 路由注册
  types.ts             # 类型定义
  version.ts           # 自动生成的版本常量
  sources/             # 各源实现
    engine.ts          # 源引擎（searchAll / fetchLyrics / scrapeBest）
    qq.ts              # 小秋
    kugou.ts           # 小枸
    netease.ts         # 小芸
    lrclib.ts          # Lrclib
  handlers/            # 请求处理器
    info.ts            # /info
    search.ts          # /search
    fetch.ts           # /fetch
    scrape.ts          # /scrape
    open-scrape.ts     # /open-scrape
    attach.ts          # /attach
    songs.ts           # /songs
    web.ts             # /
  crypto/              # 加解密工具（tripledes / xor / eapi）
  parsers/             # 歌词解析器
  utils/               # 通用工具（fetch / scorer / lrc_builder）
static/
  index.html           # Web 控制台（歌曲列表 + 接口说明 + 接口测试）
scripts/
  prebuild.mjs         # 构建前版本同步脚本
.github/workflows/
  release.yml          # 标签推送时自动构建发布
```

## 自动化发布

推送 `v*` 标签触发 GitHub Actions 工作流：

1. 校验标签版本与 `package.json` 一致
2. 运行 `npm run build`
3. 创建 GitHub Release 并附加 `.jsplugin.zip`

```bash
npm version 2026.7.15
git push --tags
```

## License

Apache-2.0
