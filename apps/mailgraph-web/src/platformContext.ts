import { ref, type App } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type PlatformLocale = 'zh-CN' | 'en-US' | 'ar'
export type PlatformTheme = 'light' | 'dark'

interface PlatformContextMessage {
  type: 'ff-platform-context'
  theme: PlatformTheme
  locale: PlatformLocale
  direction: 'ltr' | 'rtl'
}

const EN: Record<string, string> = {
  知识库: 'Knowledge Base',
  '按目录组织上传文件，内容将进入现有 AI 检索与关系图谱。':
    'Organize files by folder for AI retrieval and knowledge graphs.',
  刷新: 'Refresh',
  刷新知识库: 'Refresh knowledge base',
  目录: 'Folders',
  新建根目录: 'New root folder',
  目录名称: 'Folder name',
  新的目录名称: 'New folder name',
  删除空目录: 'Delete empty folder',
  确认创建: 'Create',
  取消: 'Cancel',
  创建第一个目录: 'Create first folder',
  当前位置: 'Current location',
  尚未选择目录: 'No folder selected',
  新建子目录: 'New subfolder',
  重命名: 'Rename',
  删除目录: 'Delete folder',
  仅可删除空目录: 'Only empty folders can be deleted',
  上传中: 'Uploading',
  上传文件: 'Upload files',
  '复制目录 ID': 'Copy folder ID',
  '目录 ID 已复制': 'Folder ID copied',
  '复制失败，请重试': 'Copy failed. Try again',
  '当前目录 ID': 'Current folder ID',
  '拖放文件到此目录，或点击选择': 'Drop files here or click to select',
  'PDF、Office、文本、HTML、JSON、图片，单文件不超过 50MB':
    'PDF, Office, text, HTML, JSON, and images; 50 MB max per file',
  请先创建或选择一个目录: 'Create or select a folder first',
  该目录还没有文件: 'No files in this folder',
  文件名: 'File name',
  大小: 'Size',
  状态: 'Status',
  上传时间: 'Uploaded',
  删除文件: 'Delete file',
  排队中: 'Queued',
  处理中: 'Processing',
  已入库: 'Indexed',
  失败: 'Failed',
  生成目录图谱: 'Generate folder graph',
  检索此目录: 'Search this folder',
  检索实验室: 'Retrieval Lab',
  对当前目录及全部子目录的已入库文件进行向量检索:
    'Run vector retrieval across indexed files in this folder and all subfolders',
  当前知识库目录: 'Current knowledge folder',
  文件数: 'Files',
  嵌入模型: 'Embedding model',
  检索问题: 'Retrieval query',
  命中数: 'Hits',
  最佳相似度: 'Best similarity',
  向量相似度: 'Vector similarity',
  复制片段: 'Copy chunk',
  详情: 'Details',
  '正在使用 text-embedding-v4 检索目录文件…':
    'Searching folder files with text-embedding-v4…',
  输入问题后开始检索当前目录: 'Enter a query to search the current folder',
  检索: 'Search',
  检索中: 'Searching',
  输入要检索的问题或关键词: 'Enter a question or keyword to search',
  '正在检索目录中的已入库文件…': 'Searching indexed files in this folder…',
  没有找到匹配的已入库内容: 'No matching indexed content found',
  相关度: 'Relevance',
  关系图谱: 'Knowledge Graph',
  '按目录、文件或邮件查看关系来源':
    'View relationships from selected files or mail',
  文件知识图谱: 'File knowledge graph',
  邮件知识图谱: 'Mail knowledge graph',
  选择图谱数据范围: 'Select graph scope',
  图谱来源类型: 'Graph source type',
  节点: 'Nodes',
  节点展示数量: 'Node display limit',
  当前: 'Visible',
  总计: 'Total',
  关系: 'Relationships',
  界面刷新: 'Refresh view',
  '刷新中…': 'Refreshing…',
  图谱概览: 'Graph overview',
  实体: 'Entities',
  暂无图谱数据: 'No graph data',
  该来源尚未构建图谱: 'No graph has been built for this source yet',
  放大: 'Zoom in',
  缩小: 'Zoom out',
  适应视图: 'Fit view',
  全屏: 'Fullscreen',
  '拖拽 · 缩放': 'Drag and zoom',
  点击节点查看详情: 'Select a node for details',
  滚轮缩放: 'Wheel to zoom',
  全部知识来源: 'All knowledge sources',
  知识库目录: 'Knowledge folders',
  知识库目录与文件: 'Knowledge folders and files',
  知识库文件: 'Knowledge file',
  文件: 'File',
  邮件: 'Mail',
  邮件来源: 'Mail sources',
  暂无知识来源: 'No knowledge sources',
  选择知识来源: 'Select knowledge source',
  选择目录或文件: 'Select a folder or file',
  选择邮件: 'Select mail',
  'AI 知识助手': 'AI Knowledge Assistant',
  新对话: 'New conversation',
  删除对话: 'Delete conversation',
  选择对话: 'Select conversation',
  会话名称: 'Conversation name',
  'Agent 记忆': 'Agent memory',
  最近关注: 'Recent focus',
  会话摘要: 'Conversation summary',
  固定上下文: 'Pinned context',
  最近话题: 'Recent topics',
  '暂无记忆。随着对话进行，Agent 会记录关键信息。':
    'No memory yet. The agent will retain important context as you chat.',
  来源加载失败: 'Failed to load sources',
  当前范围: 'Current scope',
  项目和合同一览: 'Projects and contracts',
  项目进展与风险: 'Project progress and risks',
  公司联系人: 'Companies and contacts',
  待办与截止日: 'Tasks and deadlines',
  'AI 正在回复…': 'AI is responding…',
  '输入你的问题…': 'Ask a question…',
  发送: 'Send',
  我: 'Me',
  'AI 助手': 'AI Assistant',
  文档: 'Documents',
  查询过程: 'Query trace',
  查看来源: 'View sources',
  收起过程: 'Hide trace',
  收起来源: 'Hide sources',
  引用来源: 'Cited sources',
  文档来源: 'Document sources',
  知识图谱: 'Knowledge graph',
  实体类型分布: 'Entity type distribution',
  实体列表: 'Entity list',
  关系列表: 'Relationship list',
  分析概览: 'Analysis Overview',
  项目看板: 'Project Dashboard',
  邮件总数: 'Total mail',
  已处理: 'Processed',
  图谱节点: 'Graph nodes',
  项目数: 'Projects',
  联系人: 'Contacts',
  人员: 'People',
  公司: 'Companies',
  任务: 'Tasks',
  事件: 'Events',
  系统: 'Systems',
  地点: 'Locations',
  其他: 'Other',
  '，另有 {count} 个': ', +{count} more',
  '图谱中暂无该项目的描述信息。':
    'No project description is available in the graph.',
  查看报告: 'View report',
  'AI 分析': 'AI analysis',
  一句话概述: 'Overview',
  '项目阶段/状态': 'Project stage / status',
  合同与金额: 'Contracts and amounts',
  关键时间节点: 'Key dates',
  核心人员: 'Key people',
  '相关公司/组织': 'Related companies / organizations',
  近期关键动态: 'Recent key activity',
  'AI 分析报告': 'AI analysis report',
  历史报告: 'Previous report',
  最新报告: 'Latest report',
  最新: 'Latest',
  历史: 'Previous',
  'AI 正在分析项目“{name}”…': 'AI is analyzing project "{name}"…',
  '正在查看历史报告（{time}）': 'Viewing the report from {time}',
  '已生成 {count} 次报告': '{count} reports generated',
  '共 {count} 个项目': '{count} projects',
  '没有匹配“{query}”的项目': 'No projects match "{query}"',
  '确定要删除项目“{name}”吗？此操作将从知识图谱中移除该项目及其关联缓存，不可撤销。':
    'Delete project "{name}"? This removes the project and its related cache from the knowledge graph and cannot be undone.',
  '删除失败：{error}': 'Delete failed: {error}',
  未知错误: 'Unknown error',
  邮件工作台: 'Mail Workbench',
  处理日志: 'Processing log',
  全部: 'All',
  未完成: 'Incomplete',
  已完成: 'Completed',
  处理所选: 'Process selected',
  删除所选: 'Delete selected',
  '删除中…': 'Deleting…',
  '确认删除选中的邮件？': 'Delete the selected mail?',
  '将删除工作台记录和知识索引，不会删除 IMAP 服务器中的原始邮件。':
    'Workbench records and knowledge indexes will be deleted. Source mail on the IMAP server will not be deleted.',
  已删除: 'Deleted',
  封邮件: 'mail messages',
  未找到: 'Not found',
  删除失败: 'Delete failed',
  来源: 'Source',
  日期: 'Date',
  主题: 'Subject',
  发件人: 'Sender',
  暂无邮件: 'No mail',
  处理邮箱: 'Mailbox',
  未配置: 'Not configured',
  管理: 'Manage',
  收起: 'Collapse',
  添加邮箱账号: 'Add mailbox account',
  服务商: 'Provider',
  '名称（备注）': 'Label',
  'IMAP 服务器': 'IMAP server',
  端口: 'Port',
  邮箱地址: 'Email address',
  '密码 / 授权码': 'Password / app password',
  保存账号: 'Save account',
  默认: 'Default',
  设为默认: 'Set default',
  删除: 'Delete',
  实时动态: 'Live activity',
  图谱状态: 'Graph status',
  建图中: 'Building graph',
  空闲: 'Idle',
  系统设置: 'System Settings',
  知识库设置: 'Knowledge Base Settings',
  服务状态: 'Service status',
  工作空间: 'Workspace',
  主导航: 'Main navigation',
  关闭导航: 'Close navigation',
  打开导航: 'Open navigation',
  当前邮箱账户: 'Current mailbox account',
  切换邮箱账户: 'Switch mailbox account',
  未配置账户: 'No account configured',
  用户偏好: 'User preferences',
  '你好，我是 MailGraph 助手': 'Hello, I am your knowledge assistant',
  '基于 LightRAG 跨文档知识图谱，用自然语言探索邮件里的':
    'Explore cross-document knowledge from files and mail using natural language',
  '客户、对接人、项目与内部负责人关系':
    'Relationships among customers, contacts, projects, and owners',
  '选择 AI 对话知识范围': 'Select AI knowledge scope',
  '⭐ 最近关注': 'Recent focus',
  '💬 会话摘要': 'Conversation summary',
  '📌 固定上下文': 'Pinned context',
  '🕐 最近话题': 'Recent topics',
  关闭: 'Close',
  '基于邮件内容自动识别的项目、人员与组织关系':
    'Projects, people, and organizations identified from knowledge sources',
  '搜索项目...': 'Search projects...',
  上一页: 'Previous',
  下一页: 'Next',
  '← 上一页': 'Previous',
  '下一页 →': 'Next',
  暂无项目数据: 'No project data',
  '请先在「邮件工作台」拉取邮件并导入到知识图谱，系统将自动识别项目信息。':
    'Import mail in the workbench to identify project information automatically.',
  删除项目: 'Delete project',
  暂无关联实体: 'No related entities',
  '在 Chat 中深度分析': 'Analyze in chat',
  '重新 AI 分析': 'Run AI analysis again',
  重新分析: 'Analyze again',
  'Chat 分析': 'Chat analysis',
  'Chat 分析 →': 'Chat analysis',
  '报告内容为空，请重新生成。': 'The report is empty. Generate it again.',
  '不满意这份报告？可以重新生成。': 'You can regenerate this report.',
  '正在从知识图谱中提取邮件、人员、合同等关键信息':
    'Extracting key mail, people, and contract information from the graph',
  导入文件: 'Import files',
  拉取邮件: 'Fetch mail',
  '搜索主题或发件人…': 'Search subject or sender…',
  '搜索主题…': 'Search subject…',
  未配置邮箱: 'Mailbox not configured',
  已配置账号: 'Configured accounts',
  '密码仅用于 IMAP 登录，加密存储':
    'The password is encrypted and used only for IMAP login',
  '如：工作邮箱': 'Example: work mailbox',
  '已保存的账号可删除，不影响已有数据':
    'Deleting a saved account does not remove existing data',
  '＋ 保存账号': 'Save account',
  全选本页: 'Select this page',
  '暂无动态 — 处理邮件后将在此显示': 'No activity yet',
  '· 轮询模式': 'Polling mode',
  '· 实时推送': 'Live updates',
  拉取数量: 'Fetch count',
  选择文件: 'Select files',
  '支持 .eml / .msg / .pst / .ost 格式': 'Supports .eml / .msg / .pst / .ost',
  文件夹: 'Folder',
  '📄 选择文件…（可多选）': 'Select files…',
  '① 选择本地邮件文件（.pst / .ost / .eml / .msg）并导入':
    'Select local mail files and import them',
  服务日志: 'Service logs',
  点击刷新查看日志: 'Refresh to view logs',
  合计: 'Total',
  '输入 Token': 'Input tokens',
  '输出 Token': 'Output tokens',
  'API 用量': 'API usage',
  '20 行': '20 lines',
  '50 行': '50 lines',
  '100 行': '100 lines',
  '⚙️ 系统设置': 'System Settings',
  '🔄 刷新': 'Refresh',
  收起目录: 'Collapse folder',
  展开目录: 'Expand folder',
  隐藏面板: 'Hide panel',
  显示面板: 'Show panel',
  管理账号: 'Manage accounts',
}

const AR: Record<string, string> = {
  知识库: 'قاعدة المعرفة',
  '按目录组织上传文件，内容将进入现有 AI 检索与关系图谱。':
    'نظّم الملفات في مجلدات للبحث بالذكاء الاصطناعي ورسوم المعرفة.',
  刷新: 'تحديث',
  刷新知识库: 'تحديث قاعدة المعرفة',
  目录: 'المجلدات',
  新建根目录: 'مجلد رئيسي جديد',
  目录名称: 'اسم المجلد',
  新的目录名称: 'اسم المجلد الجديد',
  删除空目录: 'حذف المجلد الفارغ',
  确认创建: 'إنشاء',
  取消: 'إلغاء',
  创建第一个目录: 'إنشاء أول مجلد',
  当前位置: 'الموقع الحالي',
  尚未选择目录: 'لم يتم اختيار مجلد',
  新建子目录: 'مجلد فرعي جديد',
  重命名: 'إعادة تسمية',
  删除目录: 'حذف المجلد',
  仅可删除空目录: 'يمكن حذف المجلدات الفارغة فقط',
  上传中: 'جارٍ الرفع',
  上传文件: 'رفع ملفات',
  '复制目录 ID': 'نسخ معرّف المجلد',
  '目录 ID 已复制': 'تم نسخ معرّف المجلد',
  '复制失败，请重试': 'فشل النسخ. حاول مرة أخرى',
  '当前目录 ID': 'معرّف المجلد الحالي',
  '拖放文件到此目录，或点击选择': 'أفلت الملفات هنا أو انقر للاختيار',
  'PDF、Office、文本、HTML、JSON、图片，单文件不超过 50MB':
    'ملفات PDF وOffice والنصوص وHTML وJSON والصور؛ 50 ميغابايت للملف',
  请先创建或选择一个目录: 'أنشئ مجلدًا أو اختره أولاً',
  该目录还没有文件: 'لا توجد ملفات في هذا المجلد',
  文件名: 'اسم الملف',
  大小: 'الحجم',
  状态: 'الحالة',
  上传时间: 'وقت الرفع',
  删除文件: 'حذف الملف',
  排队中: 'في الانتظار',
  处理中: 'قيد المعالجة',
  已入库: 'مفهرس',
  失败: 'فشل',
  生成目录图谱: 'إنشاء رسم المجلد',
  检索此目录: 'البحث في هذا المجلد',
  检索实验室: 'مختبر الاسترجاع',
  对当前目录及全部子目录的已入库文件进行向量检索:
    'بحث متجهي في الملفات المفهرسة في هذا المجلد ومجلداته الفرعية',
  当前知识库目录: 'مجلد المعرفة الحالي',
  文件数: 'الملفات',
  嵌入模型: 'نموذج التضمين',
  检索问题: 'استعلام الاسترجاع',
  命中数: 'النتائج',
  最佳相似度: 'أفضل تشابه',
  向量相似度: 'التشابه المتجهي',
  复制片段: 'نسخ المقطع',
  详情: 'التفاصيل',
  '正在使用 text-embedding-v4 检索目录文件…':
    'جارٍ البحث في الملفات باستخدام text-embedding-v4…',
  输入问题后开始检索当前目录: 'أدخل استعلامًا للبحث في المجلد الحالي',
  检索: 'بحث',
  检索中: 'جارٍ البحث',
  输入要检索的问题或关键词: 'أدخل سؤالاً أو كلمة مفتاحية للبحث',
  '正在检索目录中的已入库文件…': 'جارٍ البحث في الملفات المفهرسة في هذا المجلد…',
  没有找到匹配的已入库内容: 'لم يتم العثور على محتوى مفهرس مطابق',
  相关度: 'الصلة',
  关系图谱: 'رسم المعرفة',
  '按目录、文件或邮件查看关系来源': 'اعرض العلاقات من الملفات أو البريد المحدد',
  文件知识图谱: 'رسم معرفة الملفات',
  邮件知识图谱: 'رسم معرفة البريد',
  选择图谱数据范围: 'اختر نطاق الرسم',
  图谱来源类型: 'نوع مصدر الرسم',
  节点: 'العقد',
  节点展示数量: 'حد عرض العقد',
  当前: 'الظاهر',
  总计: 'الإجمالي',
  关系: 'العلاقات',
  界面刷新: 'تحديث العرض',
  '刷新中…': 'جارٍ التحديث…',
  图谱概览: 'ملخص الرسم',
  实体: 'الكيانات',
  暂无图谱数据: 'لا توجد بيانات رسم',
  该来源尚未构建图谱: 'لم يُنشأ رسم لهذا المصدر بعد',
  放大: 'تكبير',
  缩小: 'تصغير',
  适应视图: 'ملاءمة العرض',
  全屏: 'ملء الشاشة',
  '拖拽 · 缩放': 'سحب وتكبير',
  点击节点查看详情: 'اختر عقدة للتفاصيل',
  滚轮缩放: 'استخدم العجلة للتكبير',
  全部知识来源: 'كل مصادر المعرفة',
  知识库目录: 'مجلدات المعرفة',
  知识库目录与文件: 'مجلدات وملفات المعرفة',
  知识库文件: 'ملف معرفة',
  文件: 'ملف',
  邮件: 'البريد',
  邮件来源: 'مصادر البريد',
  暂无知识来源: 'لا توجد مصادر معرفة',
  选择知识来源: 'اختر مصدر المعرفة',
  选择目录或文件: 'اختر مجلدًا أو ملفًا',
  选择邮件: 'اختر بريدًا',
  'AI 知识助手': 'مساعد المعرفة بالذكاء الاصطناعي',
  新对话: 'محادثة جديدة',
  删除对话: 'حذف المحادثة',
  选择对话: 'اختر محادثة',
  会话名称: 'اسم المحادثة',
  'Agent 记忆': 'ذاكرة الوكيل',
  最近关注: 'الاهتمام الأخير',
  会话摘要: 'ملخص المحادثة',
  固定上下文: 'السياق المثبت',
  最近话题: 'المواضيع الأخيرة',
  '暂无记忆。随着对话进行，Agent 会记录关键信息。':
    'لا توجد ذاكرة بعد. سيحتفظ الوكيل بالسياق المهم أثناء المحادثة.',
  来源加载失败: 'فشل تحميل المصادر',
  当前范围: 'النطاق الحالي',
  项目和合同一览: 'المشاريع والعقود',
  项目进展与风险: 'تقدم المشروع والمخاطر',
  公司联系人: 'الشركات وجهات الاتصال',
  待办与截止日: 'المهام والمواعيد',
  'AI 正在回复…': 'الذكاء الاصطناعي يجيب…',
  '输入你的问题…': 'اكتب سؤالك…',
  发送: 'إرسال',
  我: 'أنا',
  'AI 助手': 'مساعد الذكاء الاصطناعي',
  文档: 'المستندات',
  查询过程: 'تتبع الاستعلام',
  查看来源: 'عرض المصادر',
  收起过程: 'إخفاء التتبع',
  收起来源: 'إخفاء المصادر',
  引用来源: 'المصادر المستشهد بها',
  文档来源: 'مصادر المستندات',
  知识图谱: 'رسم المعرفة',
  实体类型分布: 'توزيع أنواع الكيانات',
  实体列表: 'قائمة الكيانات',
  关系列表: 'قائمة العلاقات',
  分析概览: 'نظرة عامة على التحليل',
  项目看板: 'لوحة المشروع',
  邮件总数: 'إجمالي البريد',
  已处理: 'تمت معالجته',
  图谱节点: 'عقد الرسم',
  项目数: 'المشاريع',
  联系人: 'جهات الاتصال',
  人员: 'الأشخاص',
  公司: 'الشركات',
  任务: 'المهام',
  事件: 'الأحداث',
  系统: 'الأنظمة',
  地点: 'المواقع',
  其他: 'أخرى',
  '，另有 {count} 个': '، و{count} أخرى',
  '图谱中暂无该项目的描述信息。': 'لا يوجد وصف للمشروع في الرسم.',
  查看报告: 'عرض التقرير',
  'AI 分析': 'تحليل بالذكاء الاصطناعي',
  一句话概述: 'نظرة عامة',
  '项目阶段/状态': 'مرحلة / حالة المشروع',
  合同与金额: 'العقود والمبالغ',
  关键时间节点: 'التواريخ الرئيسية',
  核心人员: 'الأشخاص الرئيسيون',
  '相关公司/组织': 'الشركات / المؤسسات ذات الصلة',
  近期关键动态: 'أحدث الأنشطة الرئيسية',
  'AI 分析报告': 'تقرير تحليل الذكاء الاصطناعي',
  历史报告: 'تقرير سابق',
  最新报告: 'أحدث تقرير',
  最新: 'الأحدث',
  历史: 'سابق',
  'AI 正在分析项目“{name}”…': 'يحلل الذكاء الاصطناعي المشروع «{name}»…',
  '正在查看历史报告（{time}）': 'عرض تقرير {time}',
  '已生成 {count} 次报告': 'تم إنشاء {count} تقارير',
  '共 {count} 个项目': '{count} مشروعًا',
  '没有匹配“{query}”的项目': 'لا توجد مشاريع تطابق «{query}»',
  '确定要删除项目“{name}”吗？此操作将从知识图谱中移除该项目及其关联缓存，不可撤销。':
    'حذف المشروع «{name}»؟ سيؤدي ذلك إلى إزالته وذاكرة التخزين المرتبطة به من رسم المعرفة ولا يمكن التراجع.',
  '删除失败：{error}': 'فشل الحذف: {error}',
  未知错误: 'خطأ غير معروف',
  邮件工作台: 'مساحة عمل البريد',
  处理日志: 'سجل المعالجة',
  全部: 'الكل',
  未完成: 'غير مكتمل',
  已完成: 'مكتمل',
  处理所选: 'معالجة المحدد',
  删除所选: 'حذف المحدد',
  '删除中…': 'جارٍ الحذف…',
  '确认删除选中的邮件？': 'هل تريد حذف البريد المحدد؟',
  '将删除工作台记录和知识索引，不会删除 IMAP 服务器中的原始邮件。':
    'ستُحذف سجلات مساحة العمل وفهارس المعرفة، ولن يُحذف البريد الأصلي من IMAP.',
  已删除: 'تم حذف',
  封邮件: 'رسائل',
  未找到: 'غير موجود',
  删除失败: 'فشل الحذف',
  来源: 'المصدر',
  日期: 'التاريخ',
  主题: 'الموضوع',
  发件人: 'المرسل',
  暂无邮件: 'لا يوجد بريد',
  处理邮箱: 'صندوق البريد',
  未配置: 'غير مهيأ',
  管理: 'إدارة',
  收起: 'طي',
  添加邮箱账号: 'إضافة حساب بريد',
  服务商: 'مزود الخدمة',
  '名称（备注）': 'التسمية',
  'IMAP 服务器': 'خادم IMAP',
  端口: 'المنفذ',
  邮箱地址: 'عنوان البريد',
  '密码 / 授权码': 'كلمة المرور / رمز التطبيق',
  保存账号: 'حفظ الحساب',
  默认: 'افتراضي',
  设为默认: 'تعيين كافتراضي',
  删除: 'حذف',
  实时动态: 'النشاط المباشر',
  图谱状态: 'حالة الرسم',
  建图中: 'جارٍ بناء الرسم',
  空闲: 'خامل',
  系统设置: 'إعدادات النظام',
  知识库设置: 'إعدادات قاعدة المعرفة',
  服务状态: 'حالة الخدمة',
  工作空间: 'مساحة العمل',
  主导航: 'التنقل الرئيسي',
  关闭导航: 'إغلاق التنقل',
  打开导航: 'فتح التنقل',
  当前邮箱账户: 'حساب البريد الحالي',
  切换邮箱账户: 'تبديل حساب البريد',
  未配置账户: 'لا يوجد حساب مهيأ',
  用户偏好: 'تفضيلات المستخدم',
  '你好，我是 MailGraph 助手': 'مرحبًا، أنا مساعد المعرفة',
  '基于 LightRAG 跨文档知识图谱，用自然语言探索邮件里的':
    'استكشف المعرفة عبر الملفات والبريد باللغة الطبيعية',
  '客户、对接人、项目与内部负责人关系': 'علاقات العملاء وجهات الاتصال والمشاريع',
  '选择 AI 对话知识范围': 'اختر نطاق معرفة المحادثة',
  '⭐ 最近关注': 'الاهتمام الأخير',
  '💬 会话摘要': 'ملخص المحادثة',
  '📌 固定上下文': 'السياق المثبت',
  '🕐 最近话题': 'المواضيع الأخيرة',
  关闭: 'إغلاق',
  '基于邮件内容自动识别的项目、人员与组织关系':
    'مشاريع وأشخاص ومؤسسات مستخرجة من مصادر المعرفة',
  '搜索项目...': 'البحث عن المشاريع...',
  上一页: 'السابق',
  下一页: 'التالي',
  '← 上一页': 'السابق',
  '下一页 →': 'التالي',
  暂无项目数据: 'لا توجد بيانات مشاريع',
  '请先在「邮件工作台」拉取邮件并导入到知识图谱，系统将自动识别项目信息。':
    'استورد البريد في مساحة العمل لاكتشاف المشاريع تلقائيًا.',
  删除项目: 'حذف المشروع',
  暂无关联实体: 'لا توجد كيانات مرتبطة',
  '在 Chat 中深度分析': 'تحليل في المحادثة',
  '重新 AI 分析': 'إعادة تحليل AI',
  重新分析: 'إعادة التحليل',
  'Chat 分析': 'تحليل المحادثة',
  'Chat 分析 →': 'تحليل المحادثة',
  '报告内容为空，请重新生成。': 'التقرير فارغ. أعد إنشاءه.',
  '不满意这份报告？可以重新生成。': 'يمكنك إعادة إنشاء التقرير.',
  '正在从知识图谱中提取邮件、人员、合同等关键信息':
    'جارٍ استخراج البريد والأشخاص والعقود من الرسم',
  导入文件: 'استيراد ملفات',
  拉取邮件: 'جلب البريد',
  '搜索主题或发件人…': 'البحث بالموضوع أو المرسل…',
  '搜索主题…': 'البحث بالموضوع…',
  未配置邮箱: 'لم يتم تهيئة البريد',
  已配置账号: 'الحسابات المهيأة',
  '密码仅用于 IMAP 登录，加密存储': 'كلمة المرور مشفرة وتستخدم لتسجيل IMAP فقط',
  '如：工作邮箱': 'مثال: بريد العمل',
  '已保存的账号可删除，不影响已有数据': 'حذف الحساب المحفوظ لا يحذف البيانات',
  '＋ 保存账号': 'حفظ الحساب',
  全选本页: 'تحديد الصفحة',
  '暂无动态 — 处理邮件后将在此显示': 'لا يوجد نشاط بعد',
  '· 轮询模式': 'وضع الاستطلاع',
  '· 实时推送': 'تحديثات مباشرة',
  拉取数量: 'عدد الرسائل',
  选择文件: 'اختر ملفات',
  '支持 .eml / .msg / .pst / .ost 格式': 'يدعم .eml / .msg / .pst / .ost',
  文件夹: 'مجلد',
  '📄 选择文件…（可多选）': 'اختر ملفات…',
  '① 选择本地邮件文件（.pst / .ost / .eml / .msg）并导入':
    'اختر ملفات البريد المحلية واستوردها',
  服务日志: 'سجلات الخدمة',
  点击刷新查看日志: 'حدّث لعرض السجلات',
  合计: 'الإجمالي',
  '输入 Token': 'رموز الإدخال',
  '输出 Token': 'رموز الإخراج',
  'API 用量': 'استخدام API',
  '20 行': '20 سطرًا',
  '50 行': '50 سطرًا',
  '100 行': '100 سطر',
  '⚙️ 系统设置': 'إعدادات النظام',
  '🔄 刷新': 'تحديث',
  收起目录: 'طي المجلد',
  展开目录: 'توسيع المجلد',
  隐藏面板: 'إخفاء اللوحة',
  显示面板: 'إظهار اللوحة',
  管理账号: 'إدارة الحسابات',
}

const messages: Record<PlatformLocale, Record<string, string>> = {
  'zh-CN': {},
  'en-US': EN,
  ar: AR,
}

const translatedSourceLookup = new Map<string, string>()
for (const translations of [EN, AR]) {
  for (const [source, translated] of Object.entries(translations)) {
    if (!translatedSourceLookup.has(translated)) {
      translatedSourceLookup.set(translated, source)
    }
  }
}

function canonicalSource(value: string): string {
  return translatedSourceLookup.get(value) ?? value
}

function canonicalTextSource(value: string): string {
  const match = value.match(/^(\s*)(.*?)(\s*)$/s)
  if (!match || !match[2]) return value
  return `${match[1]}${canonicalSource(match[2])}${match[3]}`
}

export const platformLocale = ref<PlatformLocale>('zh-CN')
export const platformTheme = ref<PlatformTheme>('light')

export function t(source: string): string {
  return messages[platformLocale.value][source] ?? source
}

export function tf(
  source: string,
  params: Record<string, string | number>,
): string {
  return t(source).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

const textSources = new WeakMap<Text, string>()
const attributeSources = new WeakMap<Element, Map<string, string>>()
const translatedAttributes = ['aria-label', 'placeholder', 'title'] as const
let translating = false
let observer: MutationObserver | null = null

function translateTextNode(node: Text) {
  if (node.parentElement?.closest('[data-no-ui-translate]')) return
  const current = node.data
  const source = textSources.get(node) ?? canonicalTextSource(current)
  textSources.set(node, source)
  const match = source.match(/^(\s*)(.*?)(\s*)$/s)
  if (!match || !match[2]) return
  const translated = t(match[2])
  const next = `${match[1]}${translated}${match[3]}`
  if (node.data !== next) node.data = next
}

function translateElementAttributes(element: Element) {
  let sources = attributeSources.get(element)
  if (!sources) {
    sources = new Map()
    attributeSources.set(element, sources)
  }
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute)
    if (!current) continue
    const source = sources.get(attribute) ?? canonicalSource(current)
    sources.set(attribute, source)
    const translated = t(source)
    if (current !== translated) element.setAttribute(attribute, translated)
  }
}

function translateSubtree(root: Node) {
  translating = true
  try {
    if (root instanceof Text) translateTextNode(root)
    if (root instanceof Element) translateElementAttributes(root)
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    )
    let current: Node | null = walker.nextNode()
    while (current) {
      if (current instanceof Text) translateTextNode(current)
      if (current instanceof Element) translateElementAttributes(current)
      current = walker.nextNode()
    }
  } finally {
    translating = false
  }
}

function startLocaleBridge() {
  translateSubtree(document.body)
  observer?.disconnect()
  observer = new MutationObserver((mutations) => {
    if (translating) return
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const text = mutation.target as Text
        const knownSource = textSources.get(text)
        if (knownSource && text.data.trim() === t(knownSource)) continue
        textSources.set(text, canonicalTextSource(text.data))
        translateTextNode(text)
      } else if (mutation.type === 'attributes') {
        const element = mutation.target as Element
        const attribute = mutation.attributeName ?? ''
        const knownSource = attributeSources.get(element)?.get(attribute)
        if (knownSource && element.getAttribute(attribute) === t(knownSource))
          continue
        attributeSources.get(element)?.delete(attribute)
        translateElementAttributes(element)
      } else {
        mutation.addedNodes.forEach(translateSubtree)
      }
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatedAttributes],
  })
}

function applyPlatformContext(context: PlatformContextMessage) {
  platformTheme.value = context.theme
  platformLocale.value = context.locale
  document.documentElement.dataset.theme = context.theme
  document.documentElement.lang = context.locale
  document.documentElement.dir = context.direction
  translateSubtree(document.body)
}

export function postPlatformRoute(
  route: RouteLocationNormalizedLoaded,
  reason: 'ready' | 'route-change' = 'route-change',
) {
  if (window.self === window.top) return
  const query = { ...route.query }
  delete query.embedded
  window.parent.postMessage(
    {
      type: 'ff-mailgraph-route',
      section: String(route.name ?? 'knowledge'),
      query,
      reason,
    },
    window.location.origin,
  )
}

export function installPlatformContext(app: App) {
  app.config.globalProperties.$t = t
  window.addEventListener(
    'message',
    (event: MessageEvent<PlatformContextMessage>) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'ff-platform-context'
      ) {
        applyPlatformContext(event.data)
      }
    },
  )
  startLocaleBridge()
}
