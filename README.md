# songloft-plugin-karaoke-lyric

卡拉 OK 歌词刮削插件，自动从多个源获取歌词并关联入库。

## 歌词源

| 源 | 标识 | 歌词类型 |
|---|---|---|
| 小秋 | `qm` | 逐行 / 逐字 |
| 小枸 | `kg` | 逐行 / 逐字 |
| 小云 | `ne` | 逐行 |
| Lrclib | `lrclib` | 逐行 |

## 功能

- **搜索** — 跨源搜索歌曲，返回匹配结果及评分
- **获取** — 指定源和歌曲信息获取歌词（原文 / 翻译 / 罗马音）
- **刮削** — 自动遍历所有源，取最优结果
- **关联** — 将歌词写入 Songloft 曲库

## 命令

```bash
npm run build      # 构建插件
npm run dev        # 开发模式
npm run validate   # 验证插件配置
```

## HTTP API

### `GET /search?title=xxx&artist=xxx`

跨源搜索歌曲。

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

### `POST /attach`

将歌词关联到指定曲库歌曲。

```json
{ "song_id": 1, "lyric": "...", "tlyric": "...", "rlyric": "..." }
```

### `GET /songs`

获取曲库中有关联歌词的歌曲列表。

## 项目结构

```
src/
  main.ts          # 插件入口
  router.ts        # HTTP 路由
  types.ts         # 类型定义
  sources/         # 各源实现
    engine.ts      # 源引擎
    qq.ts          # 小秋
    kugou.ts       # 小枸
    netease.ts     # 小云
    lrclib.ts      # Lrclib
  handlers/        # 请求处理器
    search.ts
    fetch.ts
    scrape.ts
    attach.ts
    songs.ts
    web.ts
  crypto/          # 加解密工具
  parsers/         # 歌词解析器
  utils/           # 通用工具
static/
  index.html       # 网页控制台
```

## License

MIT
