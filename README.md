# Arthur — Personal Portfolio

Arthur 的个人网站，基于 React、TypeScript、Vite、GSAP 和 Lenis。

## 本地运行

使用 Node.js 22（至少 22.18）和 npm，版本入口为 `.nvmrc`。Docker 与 CNB 同样使用 Node 22；不要求日常开发运行在容器中。

```sh
npm ci
npm run dev
```

## 构建与预览

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到静态网站托管服务。运行时无 Node.js 服务端、数据库或 COS 凭据依赖。缺少素材的开发/构建环境需要临时只读 COS 授权，详见 [素材同步与镜像构建](docs/assets.md)。

正式首页 **`/` 已使用全屏视频开场**，原多语言 Hello 已移除。点击画面、向下滚动或按 Escape 进入完整网站；导航末尾的上箭头可返回影片。每次刷新默认静音，只有主动操作声音按钮才开启声音。

视频（保留音轨）、封面和 8 张响应式职业照由 `assets/manifest.json` 锁定 COS 版本、对象路径、字节数与 SHA-256。`npm run dev` 和 `npm run build` 会先检查本地副本，仅下载缺失或损坏的文件；有效缓存不需要网络或凭据。构建后再检查 `dist/` 中全部 10 个素材，避免漏打包。

需要主动重拉全部素材时执行 `npm run assets:pull`。当前 macOS 开发机已将授权保存在系统钥匙串，脚本和 Docker 构建包装器自动读取，无需 `.env`；仓库不包含密钥。其他开发机及 Linux / CI 仍需配置授权，详见素材文档。

现有 Git 素材副本暂作迁移兼容保留：在确认 CNB 远程构建也能获取只读授权并完成冷构建前，不提前取消追踪，以免破坏已有自动发布。COS 同步已经可用于空素材目录，并不依赖这些副本才能工作。

验收命令：`npm run build && node --test qa/*.test.mjs`。应测试 `npm run preview` 的根地址 `/`，而非仅检查旧试映路径。

## 目录

- `src/App.tsx`：开场、Hero、内容、联系方式。
- `src/motion.ts`：平滑滚动、进入动画、无障碍动效控制。
- `src/components/SelectedWork.tsx`：项目场景展示。
- `src/components/AboutEditorial.tsx`：About 与响应式高清职业照。
- `src/components/SiteDetails.tsx`：导航、进度、磁性反馈与 Contact 细节。
- `src/components/film/`：正式视频开场、切换状态机、输入与静音控制。
- `src/styles.css`、`src/components/*.css`：视觉与响应式样式。
- `public/`：职业照、本地字体、原片与影片封面。
- `assets/manifest.json`：固定版本素材清单，无密钥、无签名链接。
- `scripts/sync-assets.mjs`：增量同步与完整性校验；只下载，不上传或修改云端权限。
- `scripts/lib/asset-credentials.mjs`：显式环境授权优先，macOS 可自动读取项目专用钥匙串条目。
- `scripts/docker-build.mjs`：将现有环境或钥匙串授权以 BuildKit secret 传给构建阶段。

网站支持手机布局、键盘导航、动效暂停与 `prefers-reduced-motion`。邮箱及电话链接会调用访客设备的邮件或电话应用，不会由网站自动发送消息。

## 素材与许可

职业照、个人资料和联系方式为网站所有者提供，不作为通用模板素材授权。影片为用户提供的第三方素材，不属于项目代码的授权范围。第三方组件见 `THIRD_PARTY_NOTICES.md`；字体许可位于 `public/fonts/`。本仓库未对自有代码授予额外开源许可。

## 维护与发布

主仓库为 [CNB framework-station/my-station](https://cnb.cool/framework-station/my-station)。生产输出为 `dist/`。本地构建、远程代码推送和服务器部署是不同状态，必须分别确认。不要将托管凭据、环境文件、依赖、构建产物或回收站文件提交到源码仓库。

任务八的修正、测试范围与尚未验证的边界见 [QA.md](QA.md)。本地 `qa.html` 仅供开发检查，不进入生产构建。

`/?entry=offer`（由 Gateway 将 `/jobs` 302 而来）与旧 `/jobs` 路径会在用户从影片进入网站后弹出确认，确认后进入同源 `/offer/`；`entry=offer` 参数在弹窗前被一次性消费清除，取消或刷新不会重复弹窗。Offer 应用不在此仓库中；独立部署本作品集时，需要由部署方另外挂载该应用或配置相应转发，不能将静态页面回退当作 Offer 服务可用。
