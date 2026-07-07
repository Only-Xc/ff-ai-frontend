# 企业经验手册

编码前通读本文件，识别命中的经验 ID，再按命中条目执行。编码后检查 diff 是否违反命中规则。

---

## 经验规则

### EXP-STYLE-001 样式来源跟随组件类型

普通 DOM 样式只写 Tailwind className；覆盖 AntD 或第三方组件内部 DOM、token 时，用 antd-style 并限制在目标组件作用域内。两条链路不混用。

BAD: 新增 styles.ts 写页面卡片背景 —— 样式来源散在 Tailwind 和 styles.ts 两处，后续改样式找不到源头
GOOD: 页面卡片 `className="flex rounded-lg border bg-white p-4"`；`.ant-table-cell` 覆盖放局部 antd-style

---

### EXP-STYLE-002 移除视觉效果同步清理来源

移除渐变、阴影、毛玻璃、装饰背景时，同步清理 token、CSS 条件样式、主题字段和组件入参，不留死代码。移除毛玻璃就同步移除 blur token 和透明背景条件。

BAD: 删了卡片的 `backdrop-filter` className，但 `glassToken` 和 `isGlass` 分支还留着 —— 死代码误导下一个人以为毛玻璃还在用
GOOD: 删除 `backdrop-filter` className，同步移除 `glassToken` 和 `isGlass` 条件分支

---

### EXP-STYLE-003 管理端优先信息密度

管理端、运营台、数据看板、配置页、高频工作流，优先保证信息密度和扫描效率：紧凑筛选区、清晰状态色、数字对齐、主操作可达。不用装饰性留白稀释信息。

BAD: 管理端列表套大圆角卡片、大留白、居中排版 —— 一屏看不了几行，运营频繁翻页
GOOD: 紧凑表格、状态色区分、金额右对齐、主操作固定可达，一屏承载更多信息

---

### EXP-STYLE-004 Apple 风格服务业务效率

用户要求管理端呈现 Apple 风格时，用细边框、轻阴影、半透明层级、清晰排版和自然动效表达质感，同时保持扫描效率。质感服务于效率，不以牺牲信息密度为代价。

BAD: 为 Apple 风格给每行加厚投影和大间距 —— 信息密度掉一半，质感盖过了效率
GOOD: 细边框加轻阴影分层，间距克制，排版清晰，表格扫描效率不变

---

### EXP-LIB-001 优先查已有依赖：dayjs、lodash-es、usehooks-ts

日期时间用 dayjs，集合转换、对象操作、节流防抖用 lodash-es 按需导入，浏览器 hook（如 useLocalStorage、useDebounce、useResizeObserver）用 usehooks-ts。动手前先查项目已有工具和当前 package 依赖，确认没有再引入新库，不手写功能等价的工具函数。

```ts
// BAD：手写等价实现，语义模糊且没走已有依赖
const compacted = list.filter(Boolean)
const [debounced, setDebounced] = useState(value)
useEffect(() => { const t = setTimeout(() => setDebounced(value), 300); return () => clearTimeout(t) }, [value])

// GOOD：复用项目已装的库
import compact from 'lodash-es/compact'
import { useDebounceValue } from 'usehooks-ts'
const compacted = compact(list)
const [debounced] = useDebounceValue(value, 300)
```

---

### EXP-DOCS-001 实现遵循最新规格

收到文档、设计稿或验收条件后，编码前重新读取最新规格，把布局、接口字段、状态流转、验收点作为实现输入，不以旧页面实现代替规格。

BAD: 用三个月前旧页面作参考，按旧接口字段编码 —— 字段已改，上线后请求对不上后端
GOOD: 打开最新规格文档，以文档中的接口字段、状态流转和验收条件为实现输入

---

### EXP-DOCS-002 参考对象先识别职责层级

参考既有页面或组件时，先判断它属于路由外壳、页面入口、交互组件、数据 hook 还是样式片段，再复用同层级模式。参考布局就复用布局结构；参考数据请求就复用 hook 模式。

BAD: 参考 ExamList 页面，把它页面入口层的 `useEffect + fetch` 直接复制进子组件 —— 数据请求下沉到组件，职责错层难维护
GOOD: 识别 ExamList 属于页面入口，数据请求在 hook 层，只在同层 hook 里复用请求模式

---

### EXP-DOCS-003 规格写到可执行层级

编写 CRUD、列表、详情、表单规格时，覆盖布局、接口字段、状态流转、筛选分页、表格列、表单校验、操作反馈和异常态。列表规格要同时写筛选项、分页规则、空态、错误态和成功反馈。

BAD: 列表规格只写了正常数据的表格列 —— 空态、错误态、分页规则缺失，开发各自发挥
GOOD: 规格覆盖筛选项、分页规则、空态、错误态、成功反馈，开发无需猜

---

### EXP-ROUTE-001 独立任务页面用独立路由

拥有独立 URL 语义、需要刷新恢复、有权限控制或面包屑的详情页、看板页、配置页，使用独立路由。列表内弹层只承载轻量确认，不承载复杂任务流。

BAD: 详情页塞进列表页的 Modal —— 刷新丢状态、无法直达、面包屑和权限语义都缺失
GOOD: 详情用 `/items/:id` 独立路由；列表内弹层只做删除确认这类轻量操作

---

### EXP-ROUTE-002 可见页面同步导航元信息

新增侧边栏可见页面或调整菜单层级时，同步更新 URL 层级、菜单排序、navKey、侧边栏高亮、面包屑和中英文 i18n 标题。不单独只加路由。

BAD: 只在路由表加了新页面 —— 侧边栏不高亮、面包屑空白、菜单标题显示成 key
GOOD: 路由、菜单排序、navKey、侧边栏高亮、面包屑、中英文标题一次补齐

---

### EXP-STATE-001 共享分页返回稳定对象

共享分页能力封装为 hook，由 hook 管理 page、pageSize、total、reset，返回稳定对象引用。调用方只传业务查询条件，不在外部维护分页状态副本。

BAD: 每个列表页各自 `useState` 维护 page/pageSize，重置逻辑到处复制 —— 行为不一致、易漏 reset
GOOD: `usePagination` 统一管 page/pageSize/total/reset，页面只传业务查询条件

---

### EXP-STATE-002 结果集变化回到第一页

筛选、搜索、Tab 切换、排序变化、pageSize 变化后重置到第一页。同一查询条件点刷新保留当前页。这两种行为语义不同，不要混用。

BAD: 切筛选条件后仍停在第 5 页 —— 新结果集只有 2 页，用户看到空白页
GOOD: 筛选/搜索/Tab/排序变化回第一页；刷新按钮保留当前页

---

### EXP-STATE-003 前端分页固定派生顺序

接口一次返回完整列表时，保留完整数据源，按筛选 → 排序 → 分组 → 分页的顺序派生当前页，不在中间步骤丢弃数据。

```ts
// BAD：先 slice 再 filter，分页基于未筛选数据，页码和总数都错
const pageData = list.slice(start, end).filter(matchFilter)

// GOOD：保留完整数据源，固定 filter → sort → slice 顺序派生
const derived = orderBy(list.filter(matchFilter), sortKey, sortOrder)
const pageData = derived.slice(start, end)
```

---

### EXP-STATE-004 业务映射建立单一来源

状态、分组、类型同时影响查询条件、筛选选项、看板列、统计口径、文案颜色时，建立单一业务映射对象，再从它派生所有下游。

```ts
// BAD：状态 key 在筛选、统计、看板列各写一遍，新增状态要改多处，极易漏
const filterOptions = [{ value: 'todo', label: '待办' }, { value: 'done', label: '完成' }]
const columns = [{ key: 'todo', title: '待办' }, { key: 'done', title: '完成' }]

// GOOD：单一 STATUS_MAP，选项、列、统计、颜色都从它派生
const STATUS_MAP = { todo: { label: '待办', color: 'gold' }, done: { label: '完成', color: 'green' } }
const filterOptions = Object.entries(STATUS_MAP).map(([value, s]) => ({ value, label: s.label }))
```

---

### EXP-THIRD-001 组件异常先核对输入契约

AntD 或第三方组件出现展示异常、交互失效时，先核对 props 类型、派生值、受控/非受控、key/value 匹配、父容器约束，再考虑样式覆盖。

BAD: Select 展示异常直接加 CSS 覆盖 —— 根因是 value 类型不匹配，CSS 治标，换数据又复现
GOOD: 先查 value/options 类型是否匹配、key 是否一致，定位根因再处理

---

### EXP-THIRD-002 Table 滚动先看几何关系

Table 出现横向滚动异常、fixed column 错位、右侧空白时，先核对所有列 width 之和、scroll.x 值和容器实际宽度，再动样式。

BAD: 右侧空白直接加 CSS 拉伸最后一列 —— 根因是列宽总和小于 scroll.x，换数据又出问题
GOOD: 先算所有列 width 之和，对齐 scroll.x 和容器宽度，几何关系对了空白自然消失

---

### EXP-THIRD-003 优先使用组件原生能力

调整第三方组件行为、布局、缩进、token 时，先查公开 props、token、slots、render props、className、style。样式覆盖是最后手段，用了也要限制在目标作用域内。

BAD: 改 Modal 宽度直接写 `.ant-modal { width: 800px }` 全局覆盖 —— 影响所有 Modal，副作用外溢
GOOD: 用 Modal 的 `width` prop；确无公开能力时，覆盖限制在局部 antd-style 作用域内

---

### EXP-LAYOUT-001 页面滚动先确定边界

调整页面高度或滚动容器时，先确定主滚动容器，打通 flex min-h-0 高度链路，确保 overflow-auto 挂在正确节点上。

BAD: 直接给内层容器加 height: 100% —— 父链没有 min-h-0，flex 子项高度塌成 auto，滚动不生效
GOOD: 外层 `flex min-h-0`，列表容器负责 `overflow-auto`，高度链路打通

---

### EXP-LAYOUT-002 测量型组件等待可见容器

表格、图表、虚拟列表放在 Tabs、Collapse、Drawer、Modal 等初始隐藏容器中时，首次测量等容器可见后再触发，或监听可见状态变化后 resize/重测。隐藏状态下 ResizeObserver 和 DOM 测量会得到 0 高度。

BAD: 图表在未激活的 Tab 里挂载就测量 —— 隐藏容器测到高度 0，切过去后图表一片空白
GOOD: 监听 Tab 激活或 Drawer 打开，可见后再触发图表 resize/重测

---

### EXP-LAYOUT-003 大列表用成熟滚动方案

数据量大、需要行复用或动态行高时，优先用项目已有的虚拟滚动能力或成熟库，不手写滚动引擎。业务层只管数据、key、渲染函数和容器尺寸。

BAD: 万行列表手写 scroll 监听 + 手算可见区间 —— 边界、行复用、位置恢复全要自己维护，易卡顿出 bug
GOOD: 用成熟虚拟列表库承载滚动和测量，业务层只提供数据、稳定 key、行渲染和容器尺寸

---

### EXP-LAYOUT-004 布局修复覆盖真实交互状态

修改布局后，按真实操作路径验证：少量数据、大量数据、横向滚动、Tab 切换、分页切换、筛选展开。不仅验证默认状态。

BAD: 调完 Table 高度只看了默认几行就提交 —— 大量数据时 fixed column 错位、分页切换高度跳动没发现
GOOD: 按真实路径验证少量/大量数据、横向滚动、fixed column、Tab 和分页切换

---

### EXP-LAYOUT-005 滚动闪烁先排查绘制来源

出现滚动白闪、整页闪烁时，先检查是否有 blur 或多层透明背景，移除大面积毛玻璃。再确认主滚动容器，用实体背景、稳定高度、`contain: paint`、`scrollbar-gutter: stable` 收敛重绘范围。

BAD: 滚动白闪去调 transition 时长 —— 根因是透明背景叠 blur 反复重绘，改动画治不了闪
GOOD: 面板改实体背景移除毛玻璃，加 `contain: paint` 和 `scrollbar-gutter: stable` 收敛重绘

---

### EXP-ABST-001 抽象先确认共同职责

多个调用点共享完全相同的职责时再抽象，页面差异由调用方传入。单页独有逻辑留在页面侧，不过早提升为共享模块。

BAD: 只有一个页面用就抽成共享 hook，还预留一堆"以后可能用"的参数 —— 抽象空转，增加理解成本
GOOD: 出现第二个相同职责的调用点再抽象；单页独有逻辑留在页面侧，差异由调用方传入

---

### EXP-ABST-002 重复配置建立单一来源

父容器和 children 重复声明 key、title、权限、展示元数据时，把配置集中在最接近声明的位置，父级负责归一化和默认值。

BAD: Tabs 的 items 写一份 key/title，筛选下拉又照抄一份 —— 改标题要改两处，迟早不一致
GOOD: 一份 tab 配置数组，同时派生 Tabs items 和筛选选项，key/title 只写一次

---

### EXP-ABST-003 第三方封装保留原生契约

封装 AntD Table、Form、Modal、Select 等复杂组件时，透传原生 props、ref、className、style、事件和插槽。封装层只承载项目默认值和布局约束，不拦截原生能力。已经能从子组件 props 合并得到的信息，优先从子组件读取并不可变合并，不要求调用方重复传入。

BAD: Table wrapper 额外要求传 `columnCount`，而这个值本可从 `columns.length` 得到 —— 冗余入参易和 columns 不同步
GOOD: wrapper 从 `columns` 读取列数并不可变合并，调用方只传 `columns`，对象引用保持稳定

---

### EXP-ABST-004 页面专属配置就近维护

columns、操作项、筛选 options、枚举展示等强绑定单页接口或权限的配置，放在页面模块附近。只有跨页面稳定复用的纯映射和工厂才进入共享模块。

BAD: 只服务考试列表的 columns 放进 shared/tableConfigs —— 共享模块被单页字段污染，改一页影响面不清
GOOD: 考试页专属 columns 放考试页面目录；跨页复用的纯映射和工厂才进共享模块

---

### EXP-ABST-005 页面模块按职责分层

路由组件放页面目录根层；局部 UI 放 components，格式化和工具函数放 utils，常量放 constants，类型放 types，状态 hook 放 hooks，请求适配放对应模块。

BAD: 路由入口 ExamList.tsx 放在 components/ 下，格式化函数也塞进组件文件 —— 入口位置和职责边界都乱
GOOD: ExamList.tsx 在页面根层；筛选栏放 components/；格式化放 utils/

---

### EXP-ABST-006 避免无语义薄封装

封装需要承载业务语义、副作用隔离、复用边界或错误处理。纯代理单行调用直接写，不封装。

```ts
// BAD：薄封装只是包了一层 setState，没有任何业务语义，增加跳转成本
const updateSelectedIds = (ids) => setSelectedIds(new Set(ids))

// GOOD：无额外规则就直接写；有业务规则时封装才有意义
setSelectedIds(new Set(ids))
```

---

### EXP-ABST-007 局部分发策略就地声明

同一函数内按事件名、命令、状态分发到少量处理方法时，在函数内声明局部映射对象，key 用协议命令或业务枚举值，不拆散成多个 if/else。

```ts
// BAD：if/else 链，分支多了难扫、易漏 default
function handle(action) {
  if (action === 'approve') return handleApprove()
  else if (action === 'reject') return handleReject()
}

// GOOD：局部映射对象，key 对齐业务枚举，分支一目了然
function handle(action) {
  const handlers = { approve: handleApprove, reject: handleReject }
  handlers[action]?.()
}
```

---

### EXP-ABST-008 少量固定枚举直接显式写出

少量固定、需要表达明确业务顺序的枚举 UI 元素，直接显式写出，不用循环。循环留给真实动态列表或重复结构收益明显的场景。

```tsx
// BAD：三个固定标签用 map，业务顺序和每项差异被数组糊住
{STATUS.map((s) => <Tag key={s.key} color={s.color}>{s.label}</Tag>)}

// GOOD：固定枚举直接写出，顺序和差异一眼可见；动态数据才用 map
<Tag color="gold">待办</Tag>
<Tag color="blue">进行中</Tag>
<Tag color="green">完成</Tag>
```

---

### EXP-VERIFY-001 编辑前后用同一检查清单

编码前列出命中的经验 ID，编码后按同一清单扫描 diff，确认没有违反命中规则。最终汇报写明关键约束执行情况，验证受限时说明原因。

BAD: 读了经验就开始写，改完直接提交 —— 没回扫 diff，样式偷偷进了 styles.ts 也没发现
GOOD: 编码前记下 EXP-STYLE-001、EXP-ABST-005，改完逐条扫 diff，汇报里写明执行情况

---

### EXP-VERIFY-002 区分既有状态和本次改动

工作区已有改动时，分别记录本次编辑、用户既有改动和环境问题，归因基于文件变更和验证证据。lint 失败来自未触碰文件时，说明来源。

BAD: lint 一片红就说"我改出问题了" —— 实际报错文件本次没碰过，归因错了
GOOD: 先 `git status --short` 分清本次触碰文件，报错来自未碰文件时如实说明来源

---

### EXP-VERIFY-003 mock 覆盖主流程状态变化

本地依赖 mock 或后端接口暂缺时，mock 覆盖列表、详情、操作成功、失败反馈和操作后的状态变化（如列表归属变化、详情同步更新）。

BAD: mock 只返回一份静态列表 —— 审批通过后列表不变、详情不同步，状态流转根本没验到
GOOD: mock 覆盖列表、详情、成功/失败反馈，以及操作后 item 移出列表、详情同步更新
