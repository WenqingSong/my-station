# COS 素材同步与发布

## 当前边界

COS 是版本化素材来源，不是浏览器的在线素材域名。浏览器仍请求本站 `/media/think-different.mp4` 和 `/arthur-editorial-*.jpg/webp`。同步到 `public/` 的文件由 Vite 复制至 `dist/`，再打包进 Nginx 镜像。运行容器不访问 COS，不携带云凭据。

本批为 1 个视频、1 张封面、8 张响应式职业照，共 5,184,290 字节。字体、SVG、代码继续由 Git 管理；未使用的旧照片副本不在本次迁移范围内。

桶：`my-station-1320839659`，地域：`ap-guangzhou`，前缀：`site-assets/27de69c/`。对象键为清单 `prefix` 与文件 `path` 拼接，本地位置为 `public/<path>`。这些信息不是密钥。

## 开发和校验

```sh
nvm use
npm ci
npm run assets:sync
npm run dev
```

`predev` / `prebuild` 自动同步，可不用单独运行同步命令。有效缓存直接复用，可离线构建。缓存损坏会重新下载。`npm run assets:verify` 只检查、不修复；构建后的 `postbuild` 同样检查 `dist/`。

`npm run assets:pull` 会重新从 COS 拉取清单内全部 10 个素材，即使本地缓存有效。仍然逐个校验并原子替换；失败时保留原文件。它不追踪远程“最新”对象、不改变素材版本，也不能与 `--check` 同用。

下载必须是 HTTP 200，大小和 SHA-256 同时匹配；网络失败、超时、403、404、截断、过大响应和错误哈希都会停止构建。临时文件通过校验后才原子替换，不拿半个文件覆盖已有副本。拒绝重定向、目录穿越与符号链接，错误信息不打印签名 URL 或 SDK 请求详情。

## 授权输入

从现有本地安全工具或 CI 密钥管理注入以下一种方式；不把真实值写在命令历史、Git、Dockerfile 或前端环境变量里：

- `COS_CREDENTIALS_JSON`：包含 `SecretId`、`SecretKey` 和可选 `SecurityToken` 的 JSON。
- 或 `COS_SECRET_ID`、`COS_SECRET_KEY`、可选 `COS_SESSION_TOKEN`。

macOS 本地开发另支持系统钥匙串自动读取：service 为 `cool.cnb.framework-station.my-station.cos`，account 为 `my-station-assets`，密码内容为同格式 JSON。当前开发机已经配置此项，日常同步、开发和镜像构建无需创建 `.env` 或重复导出变量。代码仅保存条目名称，不保存密钥值。显式环境输入优先，不会用钥匙串掩盖无效或不完整的 CI 授权。有效缓存和只读校验不会访问钥匙串。

钥匙串只对当前 macOS 用户有效，不会随 Git 同步到其他电脑或 CNB。Linux / CI 继续使用上面的环境或 BuildKit 授权；不能将“本机自动读取”当作“远程构建已经授权”。

优先使用短期、仅允许指定 `site-assets/<revision>/*` 的 GetObject 权限。脚本只发送 GET 请求，不代表所注入账号的权限已经被自动收窄；IAM 权限须由授权系统保证。本次实现不更改 CAM、桶 ACL、DNS 或公开读写权限，也不将聊天中的凭据持久保存。

完整本地缓存不读取凭据。缺少素材时若无有效凭据，命令明确失败，不会静默使用其他版本、自动公开文件或下载 Git 历史作为替代来源。

## 镜像构建

```sh
npm run image:build -- -t arthur-portfolio:local .
docker run --rm -p 127.0.0.1:4173:80 arthur-portfolio:local
```

构建包装器仅将环境变量**名称**通过 `--secret id=...,env=...` 交给 Docker，不将值放入命令参数。Dockerfile 在专门的素材同步步骤使用 BuildKit secret 环境挂载，后续构建步骤不再挂载。最终镜像只复制 `dist/`，不复制 SDK、源码、授权、Node 或 npm。

直接使用 `docker build` 时，可用 `--secret id=cos_credentials,env=COS_CREDENTIALS_JSON`，也支持 `cos_secret_id`、`cos_secret_key`、`cos_session_token` 三个独立 secret。不要使用 `--build-arg`、Dockerfile `ENV` 或 `COPY` 携带密钥。

当前项目尚保留 Git 中的素材缓存，因此已有无 COS 授权的构建仍可成功。这是有意保留的迁移兼容，并非构建暗中忽略错误。

## CNB 接入与取消 Git 追踪门槛

`.cnb.yml` 已调用同一个镜像构建包装器，普通 `npm run build` 同样自动同步。对需要从 COS 冷下载的构建，须通过 CNB 的安全导入机制向相应任务提供以上环境授权。不能把真实密钥写进 `.cnb.yml`，也不能为了 PR 构建把凭据暴露给不受信任的代码。

目前没有为 COS 新增远程密钥仓库或更改已有 GitHub 镜像同步密钥导入；不能假设聊天中的授权已自动配置进 CNB。

取消素材 Git 追踪前需要：

1. 空素材源码能通过同步、构建，所有发布素材哈希一致。
2. 最终 Nginx 镜像在无外网环境下也能提供完整网页、图片与视频分段请求。
3. CNB 主分支及需要发布的受信任构建已验证只读授权和冷下载；PR / fork 的授权边界有明确策略。
4. 完成后只对清单列出的 10 个文件执行 `git rm --cached`，加入精确忽略项，保留本地缓存及历史提交，不重写 Git 历史。

第 3 项尚未验证前，保留已追踪文件，不用会损坏自动发布的删除来表示“迁移完成”。后续新增资源仍须先上传到新版本路径、验证并更新清单；禁止覆盖旧版本或把 `latest` 写进清单。

## 失败与回退

下载失败：保留现有镜像；不要发布残缺 `dist/`。恢复网络/授权后重试，不关闭哈希检查。

素材更新：发布新对象路径与清单；保留旧对象用于历史版本构建。回退代码提交及对应镜像即可，无须让浏览器选择资源版本。

密钥轮换：影响后续需要下载的构建，不影响已经包含全部素材的运行镜像。

## 验证命令

```sh
npm run build
npm test
```

单独同步逻辑测试：`npm run test:assets`。测试使用临时文件与合成授权，不含真实云密钥。实际云下载、镜像和运行验收范围另记于 `qa/cos-assets.md`。

参考：[Vite public 目录](https://vite.dev/guide/assets.html#the-public-directory)、[Docker Build secrets](https://docs.docker.com/build/building/secrets/)、[CNB 环境变量](https://docs.cnb.cool/en/build/env.html)。
