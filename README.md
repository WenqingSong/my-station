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

## 源码快照

本次导出包含网站任务一至七的当前实现，源版本为 `d108d0ddd6a94b6638e18bbc96355dd1db451c66`。不包含托管凭据、原托管仓库历史、平台内部配置、构建产物或依赖目录。原网站的发布方式保持不变；向 CNB 推送源码本身不会自动部署网站。
