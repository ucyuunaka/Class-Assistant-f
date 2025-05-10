# 课堂助手

课堂助手是一款专为学生设计的全方位学习管理工具，旨在帮助学生更高效地管理课程、跟踪成绩、规划备考，并提供个性化的学习体验。

## 基本介绍

本项目是一个基于 Vite 构建的纯前端 Web 应用，主要使用 HTML、CSS 和 JavaScript 实现。应用数据主要存储在浏览器本地（如 `localStorage`），无需后端支持即可运行。应用界面简洁易用，支持多种主题，并具备数据备份和恢复功能。

## 文件路径

项目主要文件和目录结构如下：

```
.
├── .gitignore
├── index.html             # 应用主入口 HTML 文件
├── package-lock.json      # 项目依赖
├── package.json           # 项目配置文件，包含项目依赖、脚本等信息
├── README.md              # 项目说明文档
├── start-dev.bat          # 【Windows环境】启动开发服务器的批处理脚本
├── vite.config.js         # Vite 构建工具的配置文件
├── components/            # 可复用的 UI 组件
│   ├── buttons/           # 按钮组件相关文件 (CSS, JS)
│   ├── footer/            # 页脚组件相关文件 (HTML, CSS, JS)
│   ├── header/            # 顶栏组件相关文件 (CSS, JS)
│   ├── modals/            # 模态框/弹窗组件相关文件 (CSS, JS)
│   ├── notifications/     # 通知提示组件相关文件 (CSS, JS)
│   ├── scrollAnimation/   # 滚动动画效果组件相关文件 (CSS, JS)
│   └── sidebar/           # 侧边栏组件相关文件 (HTML, CSS, JS)
├── css/                   # CSS 样式文件
│   ├── styles.css         # 全局基础样式文件
│   ├── pages/             # 各个页面的特定样式文件
│   │   ├── countdown.css  # 考试倒计时页面的样式
│   │   ├── grades.css     # 成绩管理页面的样式
│   │   ├── index.css      # 主页的样式
│   │   ├── lesson.css     # 课评速记页面的样式
│   │   ├── login.css      # 登录注册页面的样式
│   │   ├── profile.css    # 个人资料页面的样式
│   │   ├── schedule.css   # 课表管理页面的样式
│   │   └── settings.css   # 设置页面的样式
│   └── themes/            # 主题相关的样式文件
│       └── themes.css     # 定义不同主题的颜色等样式
├── js/                    # JavaScript 脚本文件
│   ├── auth.js            # 用户认证相关的逻辑 (登录、注册)
│   ├── main.js            # 应用主逻辑文件，初始化和协调各模块
│   ├── themes.js          # 主题切换相关的逻辑
│   └── pages/             # 各个页面的特定 JavaScript 逻辑
│       ├── countdown/     # 考试倒计时页面的 JS 文件
│       │   ├── countdown.js             # 倒计时页面主逻辑
│       │   ├── countdown_controller.js  # 倒计时控制器，处理用户交互
│       │   ├── countdown_data.js        # 倒计时数据管理
│       │   ├── countdown_events.js      # 倒计时事件处理
│       │   └── countdown_render.js      # 倒计时页面渲染逻辑
│       ├── grades.js      # 成绩管理页面的 JS 逻辑
│       ├── index.js       # 主页的 JS 逻辑
│       ├── lesson.js      # 课评速记页面的 JS 逻辑
│       ├── login.js       # 登录注册页面的 JS 逻辑
│       ├── profile.js     # 个人资料页面的 JS 逻辑
│       ├── schedule/      # 课表管理页面的 JS 文件
│       │   ├── schedule.js              # 课表页面主逻辑
│       │   ├── schedule_cache.js        # 课表数据缓存处理
│       │   ├── schedule_controller.js   # 课表控制器，处理用户交互
│       │   ├── schedule_data.js         # 课表数据管理
│       │   ├── schedule_drag.js         # 课表拖拽功能逻辑
│       │   ├── schedule_events.js       # 课表事件处理
│       │   └── schedule_render.js       # 课表页面渲染逻辑
│       └── settings.js    # 设置页面的 JS 逻辑
├── pages/                 # 存放各个功能页面的 HTML 文件
│   ├── countdown.html     # 考试倒计时页面
│   ├── grades.html        # 成绩管理页面
│   ├── lesson.html        # 课评速记页面
│   ├── login.html         # 登录注册页面
│   ├── profile.html       # 个人资料页面
│   ├── schedule.html      # 课表管理页面
│   └── settings.html      # 设置页面
└── public/                # 存放静态资源，会被直接复制到构建输出目录
    ├── icons/             # 存放应用图标等图片资源
    └── lib/               # 存放第三方库文件
        └── chart.umd.min.js # Chart.js 图表库文件
```

项目主要文件和目录结构如上所示。

## 各页面内容

- **主页 (`index.html`)**: 应用的入口页面，提供核心功能的介绍、最新动态、快速入门指南、用户反馈和统计数据。
- **课表管理 (`pages/schedule.html`)**: 提供课程表的创建、编辑和管理。支持周视图和列表视图切换，课程数据本地持久化存储，并支持课程的添加、编辑、删除和拖放移动功能。可导入/导出课表（iCal, CSV），打印课表，并支持清空课表。
- **成绩管理 (`pages/grades.html`)**: 提供成绩录入、概览和分析功能。用户可以记录各科成绩，查看总 GPA、平均分等统计信息。利用 Chart.js 库生成成绩趋势图表、科目分布雷达图和成绩比较柱状图，帮助用户可视化分析成绩表现。支持成绩导出和分享（部分功能开发中）。
- **考试倒计时 (`pages/countdown.html`)**: 用于管理和跟踪考试日期。用户可以添加、编辑和删除考试，查看距离考试的剩余时间，并支持搜索、排序和筛选功能。倒计时计算逻辑由 JavaScript 实现。
- **课评速记 (`pages/lesson.html`)**: 允许用户记录对课程的简短评价和感受，支持添加表情和预设标签，并查看历史评价记录。
- **登录与注册 (`pages/login.html`)**: 用户登录和新用户注册的入口。包含简单的首次登录流程检查和重定向逻辑。
- **个人资料 (`pages/profile.html`)**: 展示和编辑用户的基本信息、教育经历，并提供账号安全设置（修改密码、绑定手机）。
- **设置 (`pages/settings.html`)**: 提供应用个性化设置，包括多种主题颜色选择（基于 CSS 变量和 JavaScript 实现）、字体大小调整、界面语言选择（基于简单的国际化实现）、通知偏好设置，以及基于 `localStorage` 的数据备份、恢复和清除功能。

## 特点功能

- **课程管理**: 可视化周课表和列表视图，支持课程的本地持久化存储、添加、编辑、删除和拖放移动。
- **成绩管理与分析**: 记录成绩，自动计算 GPA 和平均分，通过多种图表（趋势图、雷达图、柱状图）进行数据可视化分析。
- **考试倒计时**: 精确计算并显示距离重要考试的剩余时间。
- **课评速记**: 快速便捷地记录课程反馈和感受。
- **个性化设置**: 提供丰富的界面定制选项，包括多主题切换、字体大小调整和语言选择。
- **数据安全与管理**: 支持本地数据备份、恢复和一键清除，保障用户数据安全。
- **用户认证**: 简单的首次登录流程引导。
- **响应式设计**: 完美适配不同尺寸的设备，提供一致的用户体验。
- **技术栈**: 基于 Vite 构建，采用纯 HTML, CSS, JavaScript 实现，轻量高效。

## 启动方式

我们提供两种方式来启动应用：

**方式一：通过命令行**

1.  确保您已安装 Node.js 和 npm。
2.  在项目根目录下打开终端。
3.  运行以下命令安装项目依赖 (如果尚未安装)：
    ```bash
    npm install
    ```
4.  运行以下命令启动开发服务器：
    ```bash
    npm run dev
    ```
5.  开发服务器启动后，请在浏览器中手动打开提示的本地地址 (通常是 `http://localhost:5173` 或类似地址) 即可访问应用。

**方式二：通过脚本 (Windows 用户)**

1.  确保您已安装 Node.js 和 npm。首次运行前，请确保已通过方式一中的 `npm install` 命令安装了项目依赖。
2.  直接双击项目根目录下的 `start-dev.bat` 脚本。
3.  此脚本会自动启动开发服务器并尝试在您的默认浏览器中打开应用。
