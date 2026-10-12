# Arthur — Personal Portfolio

Arthur 的个人网站，基于 React、TypeScript、Vite、GSAP 和 Lenis。

## 本地运行

使用 Node.js 22 LTS 和 npm。

```sh
npm ci
npm run dev
```

## 构建与预览

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到静态网站托管服务。当前项目无服务端、数据库或环境变量依赖。

## 目录

- `src/App.tsx`：开场、Hero、内容、联系方式。
- `src/motion.ts`：平滑滚动、进入动画、无障碍动效控制。
- `src/components/SelectedWork.tsx`：项目场景展示。
- `src/components/AboutEditorial.tsx`：About 与响应式高清职业照。
- `src/components/SiteDetails.tsx`：导航、进度、磁性反馈与 Contact 细节。
- `src/styles.css`、`src/components/*.css`：视觉与响应式样式。
- `public/`：职业照和本地字体。

网站支持手机布局、键盘导航、动效暂停与 `prefers-reduced-motion`。邮箱及电话链接会调用访客设备的邮件或电话应用，不会由网站自动发送消息。

## 素材与许可

职业照、个人资料和联系方式为网站所有者提供，不作为通用模板素材授权。第三方组件见 `THIRD_PARTY_NOTICES.md`；字体许可位于 `public/fonts/`。本仓库未对自有代码授予额外开源许可。

## 维护与发布

主仓库为 [WenqingSong/my-station](https://github.com/WenqingSong/my-station)。生产输出为 `dist/`，GitHub 推送与现有 Sites 网站发布是两个独立步骤。不要将托管凭据、环境文件、依赖、构建产物或回收站文件提交到源码仓库。

任务八的修正、测试范围与尚未验证的边界见 [QA.md](QA.md)。本地 `qa.html` 仅供开发检查，不进入生产构建。

`/?entry=offer`（由 Gateway 将 `/jobs` 302 而来）与旧 `/jobs` 路径会在开场动画结束后弹出确认，确认后进入同源 `/offer/`；`entry=offer` 参数在弹窗前被一次性消费清除，取消或刷新不会重复弹窗。Offer 应用不在此仓库中；独立部署本作品集时，需要由部署方另外挂载该应用或配置相应转发，不能将静态页面回退当作 Offer 服务可用。
