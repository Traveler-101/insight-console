# Insight Console · 运营数据中台

一个可以直接写进简历、也经得起面试追问的 React 中后台项目。不是 CRUD 模板：里面有 1 万行数据的虚拟滚动、自研 SVG 图表、RBAC 权限、乐观更新和一套可量化的性能取舍。

**技术栈**：React 18 · TypeScript（strict）· Vite 5 · React Router 6 · TanStack Query 5 · Zustand 4 · Vitest

**在线演示**：https://insight-console.app.workbuddy.host/?sharecode=ZLGNQ2ZR2L

---

## 项目背景

团队每周的经营周报要靠人工从多个后台导出 Excel 再拼表，一次汇总两小时起步，口径还经常对不上。这个小工具的目标是把这件事收敛成一套固定口径的看板：

- **指标口径统一**：营收、订单、转化率、渠道 ROI 在 `api/mockData.ts` 里用固定种子生成，同一时间范围每次打开数字一致，方便对照；
- **一次配置到处能用**：时间范围、指标类型、信息密度都在本地持久化，刷新后保持上次的查看习惯；
- **不同角色看不同东西**：运营负责人看全量并导出，分析师只看不改，实习生只读，避免误操作；
- **快**：订单明细万级数据要能连续滚动浏览，而不是来回翻页。

数据层用 mock 模拟，接口契约、延迟、失败与取消都是真实的，替换 `api/client.ts` 里的实现即可对接真实后端。

---

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 单元测试 + 组件测试
npm run build    # 类型检查 + 生产构建
```

演示账号（统一密码 `insight2026`）：

| 账号 | 角色 | 能做什么 |
| --- | --- | --- |
| `admin@insight.dev` | 管理员 | 全部权限：改订单、导数据、调角色 |
| `analyst@insight.dev` | 数据分析师 | 查看 + 导出，不能改数据/管成员 |
| `viewer@insight.dev` | 只读成员 | 只能看，导出与写操作全部禁用 |

> 换账号登录，重点看「订单中心」的批量操作、「增长分析」的导出按钮、「成员与权限」的下拉框——同一套代码，UI 会按角色自动降级。

---

## 页面与能力

| 页面 | 功能 | 面试可讲的技术点 |
| --- | --- | --- |
| 经营概览 | KPI 卡、趋势图、渠道环形图、漏斗、实时动态、渠道排行 | rAF 数字滚动、SVG 响应式重绘、`useElementSize` |
| 增长分析 | 指标切换、7 日移动平均、漏斗、渠道对比、留存热力图、CSV 导出 | 派生数据 `useMemo`、纯函数计算、权限驱动的按钮禁用 |
| 订单中心 | 1 万条订单、搜索防抖、筛选排序、虚拟滚动、多选批量、详情抽屉、乐观更新 | 虚拟滚动、`keepPreviousData`、乐观更新与回滚 |
| 成员与权限 | 成员列表、角色切换、权限矩阵、我的权限 | RBAC、路由/组件/数据三层权限 |
| 工作台设置 | 深浅主题、信息密度、演示数据重置、账号信息 | CSS 变量主题、Zustand persist |

另外还有：登录页（含来路回跳）、404 页、命令面板（`Ctrl/⌘ + K`）、Toast、骨架屏、错误边界。

---

## 目录结构

```
src/
├── api/                 # 数据访问层（模拟后端）
│   ├── client.ts        # 统一延迟 / 错误 / AbortSignal 取消
│   ├── mockData.ts      # 固定种子生成 1 万条订单、趋势、留存
│   ├── analytics.ts     # 指标接口
│   ├── orders.ts        # 订单查询 / 更新 / 导出（带内存库）
│   ├── users.ts         # 成员与角色
│   └── auth.ts          # 登录、会话、演示账号
├── components/
│   ├── charts/          # AreaChart / DonutChart / Sparkline / Funnel / Heatmap
│   ├── table/           # VirtualTable（通用泛型虚拟表格）
│   ├── layout/          # Sidebar / Topbar / AppLayout / CommandPalette
│   ├── ui/              # Button / Card / Badge / Drawer / Toast / Skeleton…
│   └── Icon.tsx         # 统一 SVG 图标集
├── config/navigation.ts # 导航与页面标题的单一数据源
├── hooks/               # useVirtualList / useDebounce / useElementSize / useCountUp / usePermission
├── pages/               # 5 个业务页面 + 登录 + 404
├── store/               # auth（会话）、ui（主题/密度/Toast）
├── styles/global.css    # 设计变量 + 全部样式
├── tests/               # 单元测试与组件测试
├── types/index.ts       # 领域模型
└── utils/               # 格式化与 CSV 导出
```

**分层原则**：页面只做编排；数据请求收敛在 `api/`；跨页面状态放 `store/`；一切可复用的展示逻辑进 `components/` 和 `hooks/`。类型全部集中定义，接口返回值与 UI 使用同一份契约。

---

## 关键实现

### 1. 虚拟滚动（`hooks/useVirtualList.ts`）

1 万条订单，DOM 里只有约 22 个行节点。

```ts
const { startIndex, endIndex } = computeVirtualWindow({ scrollTop, viewportHeight, itemHeight, overscan, total });
```

- 外层滚动容器 + 内层 `height = total * itemHeight` 撑开滚动条 + 绝对定位渲染可视行；
- `overscan = 8`，上下多渲染几行，避免快速滚动白屏；
- 滚动事件用 `requestAnimationFrame` 合帧，避免一帧内多次 render；
- `ResizeObserver` 监听视口高度，侧边栏折叠、窗口缩放都会重算；
- 纯函数 `computeVirtualWindow` 单独导出，边界（空列表、滚到底、数据变少）都有单测。

### 2. 自研 SVG 图表（`components/charts/AreaChart.tsx`）

没有引入 ECharts / Recharts，约 200 行覆盖：

- 线性比例尺 + `niceCeil` 让 Y 轴刻度落在整数上；
- Catmull-Rom 转贝塞尔的平滑曲线，面积用渐变填充；
- `getBoundingClientRect` 做命中测试，最近点吸附 + 十字准线 + Tooltip；
- 键盘 `←/→` 移动高亮数据点，图表可聚焦、可读屏；
- `ResizeObserver` 驱动重绘，宽度变化时 X 轴刻度数量自适应。

### 3. 权限模型（RBAC）

| 层级 | 实现 |
| --- | --- |
| 路由级 | `RequireAuth`：无会话重定向登录并记录 `state.from`，登录后回跳 |
| 组件级 | `usePermission().can('order:update')` 控制按钮禁用/隐藏、显示锁定提示 |
| 数据级 | 文档中明确：服务端必须二次校验，前端权限只负责体验 |

角色 → 权限的映射只有一份（`api/mockData.ts` 的 `ROLE_PERMISSIONS`），登录后随 Session 一起下发。

### 4. 乐观更新（`pages/Orders.tsx`）

改订单状态时 UI 立即响应，失败回滚：

```ts
onMutate: async ({ id, status }) => {
  await queryClient.cancelQueries({ queryKey: ['orders'] });
  const snapshot = queryClient.getQueryData(['orders', query]);
  queryClient.setQueryData(['orders', query], patch);      // 先改缓存
  return { snapshot };
},
onError: (_e, _v, context) => queryClient.setQueryData(['orders', query], context.snapshot),
onSettled: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
```

批量操作则是 `Promise.all` 后统一 invalidate，并用 Toast 汇报结果。

### 5. 请求竞态与取消

`api/client.ts` 自己实现可取消的延迟：`signal.addEventListener('abort')` 清理定时器并抛 `AbortError`。React Query 的 `queryFn` 直接接收 `signal`，切换时间范围时旧请求会被取消，不会出现「后发先至」覆盖新数据。

### 6. 主题与信息密度

`data-theme="light|dark"` 挂在 `<html>` 上，全部颜色走 CSS 变量；密度用 `data-density` 控制间距。两者都由 Zustand + `persist` 存到 localStorage，刷新不丢。

### 7. 状态管理边界

- **服务端状态**（指标、订单、成员）→ TanStack Query：缓存、重试、失效、乐观更新都由它管；
- **客户端状态**（会话、主题、侧边栏、Toast）→ Zustand：不复制服务端数据，只存 UI 关注的东西。

这也是面试里「为什么不用 Redux」的正面回答：这个项目没有复杂的时间旅行/中间件需求，Query + 轻量 store 的组合更贴合。

---

## 性能与可访问性

- 1 万行订单：初始 render 的 DOM 行数 ≈ 22，滚动时只有窗口内的行在变；
- 搜索 320ms 防抖 + `keepPreviousData`，输入时不闪白；
- 生产构建手动分包（`react` / `@tanstack/react-query` 独立 chunk），利于长缓存；
- 全部图标、图表为内联 SVG，无图表库体积；
- 图表可 Tab 聚焦、方向键浏览；抽屉有 `role="dialog"`、Esc 关闭、滚动锁定、焦点管理；
- Toast 使用 `aria-live="polite"`，开关使用 `role="switch"` + `aria-checked`；
- 尊重 `prefers-reduced-motion`，动画自动降级。

---

## 测试

```bash
npm test
```

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/format.test.ts` | 金额压缩（万/亿）、百分比、环比符号 |
| `tests/csv.test.ts` | CSV 逗号/引号/换行转义、空值 |
| `tests/virtualWindow.test.ts` | 首屏窗口、滚动跟随、滚到底不越界、空数据 |
| `tests/VirtualTable.test.tsx` | 1 万行只渲染可视行、空状态 |
| `tests/auth.test.ts` | 登录失败、管理员权限、只读角色权限 |
| `tests/pages.test.tsx` | 四个业务页面的渲染冒烟（含数据加载完成） |

共 19 个用例。`npm test` 使用 `--pool=forks`，避免 CI 容器里 worker 线程写临时文件被限制。

---

## 面试讲解提纲（可直接背）

1. **为什么自己写图表，不用 ECharts？** 项目只需要折线/环形/漏斗/热力图四类，图表库体积 200KB+ 且定制成本高；自研后包体更小、交互可控，也证明我能处理比例尺和坐标变换。真实业务里如果图表种类多，我会选库而不是重复造轮子。
2. **虚拟滚动的原理？** 三句话：占位高度撑开滚动条、`scrollTop / itemHeight` 算出窗口、只渲染窗口内的行。难点在边界（数据变少、滚到底）和滚动性能（rAF 合帧、`contain: strict`）。
3. **为什么固定行高？** 变高场景需要测量缓存 + 二分查找定位，复杂度和维护成本高；订单表格行高一致，固定行高换来实现简单和 O(1) 定位。
4. **React Query 和 Zustand 怎么分工？** Query 管服务端状态的缓存与生命周期，Zustand 管 UI 状态；不把接口数据再抄一份到 store，避免双份状态不同步。
5. **乐观更新失败了怎么办？** `onMutate` 保存快照，`onError` 回滚，`onSettled` 兜底失效重拉。
6. **权限为什么不能只做前端？** 前端权限只是体验层，接口必须二次校验；项目里 `updateOrderStatus` 的 mock 层同样可以加角色校验。
7. **1 万行为什么不直接分页？** 业务上需要跨页搜索/排序且希望连续浏览，所以做成「服务端筛选排序 + 前端虚拟滚动」；也保留了每页条数切换，能对比两种方案。
8. **性能优化做了哪些？** 窗口化渲染、memo 化的列定义、rAF 节流、防抖、请求取消、分包、CSS 变量主题（不做整树重渲染）。
9. **StrictMode 下会请求两次吗？** 开发环境 effect 会执行两次，React Query 有去重，`useVirtualList` 的监听在 cleanup 中正确释放；这也是我坚持写 cleanup 的原因。
10. **如果继续迭代？** 错误边界细化到路由级、列表支持列宽拖拽与列设置持久化、用 MSW 替换 mock 层、补 Playwright 端到端用例、图表大数据量改 Canvas 渲染。

---

## 已知取舍

- 数据由前端 mock 生成（固定种子，保证可复现），没有真实后端；
- 没有做 SSR / 国际化；开发环境用 `BrowserRouter`，生产构建切 `HashRouter`，原因是纯静态托管没有 history fallback，子路径直达或刷新会 404。接入 nginx `try_files` 或 CDN 的 SPA 回退规则后改回 `BrowserRouter` 即可（`src/main.tsx` 一处开关）；
- 虚拟表格固定行高；变高列表会换成测量缓存方案；
- 图表为自研轻量实现，不追求完整图表库能力（缩放、刷选、多轴暂未覆盖）。

---

## 部署

### GitHub Pages（已内置 Actions 工作流）

`.github/workflows/deploy.yml` 会在每次 push 到 `main` 时自动构建并发布 `dist`。首次使用：

1. 在 GitHub 新建一个空仓库（不要勾选初始化 README）；
2. 本地执行：

```bash
git remote add origin https://github.com/<你的用户名>/insight-console.git
git branch -M main
git push -u origin main
```

3. 打开仓库 **Settings → Pages**，把 Source 选为 **GitHub Actions**；
4. 等 Actions 跑完，访问 `https://<你的用户名>.github.io/insight-console/`。

资源路径用的是相对路径（`vite.config.ts` 中 `base: './'`），所以放在 `/<repo>/` 子路径下也能正常加载，无需改配置。

### 手动部署到任意静态服务器

```bash
npm run build
# 将 dist/ 上传至任意静态服务器
```

如果托管方不支持 history fallback，保持 `HashRouter`（默认）；支持时把 `src/main.tsx` 的 Router 换回 `BrowserRouter`，URL 更干净。
