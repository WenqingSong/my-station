# 项目章节切换重构

2026-11-02，本地生产预览。

## 调整

- 移除 Work 场景的 sticky、负 top、额外停留距离以及整场景缩小淡出，三个项目统一走正常文档布局，消除跨项目叠层依赖。
- 移除 SelectedWork 的 ScrollTrigger、scrub 裁切、滚动视差与鼠标倾斜逻辑，删除不再使用的 work-scene-metrics.ts。
- 图片主视觉仅用 IntersectionObserver 触发一次 14px 轻微入场，反向滚动不反复播放；无观察器时内容依旧可见，减少动效及全站暂停时不播放入场。
- 电商与 Offer 捕手调整留白、文字层次、圆角与背景；新增双向项目导航。原源码、证据链接和展开结构交互保留。

## 实际检查

- 构建通过；71/71回归检查通过，旧 sticky 几何测试随实现移除，加入无滚动叠层/内容默认可见约束。
- GPT 内置浏览器：默认836px桌面、390×844手机，实际点击电商→Offer→电商，并验证手机展开结构、无横向溢出。三个场景 position=relative，scene-inner transform=none，opacity=1。
- Safari：本机真实浏览器（WebKit），实际查看深色电商、项目边界与 Offer 章节；点击下一项目后 URL=#work-matching；没有重叠或整块淡化。测试新建的标签页已关闭，原有标签保留。
- 内置浏览器控制台无错误/警告；截图记录在 outputs/project-chapters-*。
- 未宣称已覆盖所有浏览器版本；未执行 Firefox/旧版移动浏览器的真机矩阵。未验证生产部署。
