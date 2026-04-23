# 个人文档库

基于 [Astro Starlight](https://starlight.astro.build/) 构建的个人知识文档库。

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:4321 查看文档网站。

## 项目结构

```
.
├── public/                  # 静态资源（favicon 等）
├── src/
│   ├── assets/             # 图片资源
│   ├── content/
│   │   └── docs/           # 文档目录（你的 Markdown 文件放这里）
│   └── styles/
│       └── custom.css      # 自定义样式
├── astro.config.mjs        # 网站配置
├── package.json
└── tsconfig.json
```

## 如何添加文档

### 1. 创建文档文件

在 `src/content/docs/` 目录下创建 `.md` 或 `.mdx` 文件：

```
src/content/docs/
├── guides/
│   └── getting-started.md    # → /guides/getting-started
├── reference/
│   └── example.md            # → /reference/example
└── index.mdx                 # → 首页（已配置为 /）
```

### 2. 配置侧边栏

在 `astro.config.mjs` 中修改 `sidebar` 配置：

```javascript
sidebar: [
  {
    label: '指南',
    items: [
      { label: '快速开始', slug: 'guides/getting-started' },
    ],
  },
  {
    label: '参考',
    autogenerate: { directory: 'reference' },  // 自动生成该目录下所有文档
  },
],
```

### 3. 文档前置matter（重要）

每个文档开头需要包含以下元数据：

```markdown
---
title: 文档标题
description: 文档描述（用于 SEO 和搜索）
---
```

可选配置：
- `sidebar.entry` - 控制是否在侧边栏显示
- `template` - 布局模板：`docs`（默认）、`splash`（首页专用）
- `hero` - 首页英雄区域配置

## Markdown 文档注意事项

### 基本语法

```markdown
# 标题一
## 标题二
### 标题三

**粗体** 和 *斜体*

[链接](https://example.com)

![图片描述](/path/to/image.png)

- 列表项 1
- 列表项 2

1. 有序列表
2. 有序列表

> 引用文字
```

### 代码块

```markdown
​```javascript
const hello = "world";
console.log(hello);
​```
```

支持语法高亮的语言：javascript, typescript, python, bash, json, yaml, html, css 等。

### 组件（仅 MDX）

在 `.mdx` 文件中可以使用 Astro 组件：

```markdown
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="标题">
    内容
  </Card>
</CardGrid>
```

常用组件：
- `Card` / `CardGrid` - 卡片布局
- `Aside` - 提示框（note、tip、caution、danger）
- `Tabs` / `TabItem` - 标签页
- `Steps` - 步骤列表

### 注意事项

1. **文件命名**：使用英文文件名，URL 会以 `/` 分隔路径
2. **中文标题**：在 `title` 前置matter 中使用中文，文件本身建议用英文
3. **图片引用**：使用相对路径，如 `./images/xxx.png` 或 `/src/assets/xxx.png`
4. **导航顺序**：Starlight 默认按文件名字母排序，可通过 `order` 前置matter 控制
5. **MDX 限制**：只有 `.mdx` 文件支持导入组件，`.md` 文件不支持

## 常用命令

| 命令                | 说明                           |
| :---------------- | :---------------------------- |
| `npm install`     | 安装依赖                        |
| `npm run dev`     | 启动开发服务器（localhost:4321） |
| `npm run build`   | 构建生产版本到 `dist/`          |
| `npm run preview` | 预览构建结果                     |
| `npm run astro -- add starlight` | 添加 Starlight 插件 |

## 部署

本项目可部署到 GitHub Pages、Vercel、Netlify 等平台。

### GitHub Pages 部署

在 `package.json` 中添加：

```json
{
  "scripts": {
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

然后在 GitHub 仓库设置中启用 GitHub Pages，Source 选择 `gh-pages` 分支。

### Vercel / Netlify

直接连接 GitHub 仓库，平台会自动检测并部署。

### Cloudflare Pages 部署

#### 方式一：使用 Wrangler CLI（推荐）

**1. 安装 Wrangler**

```bash
npm install -D wrangler
```

**2. 登录 Cloudflare**

```bash
npx wrangler login
```
浏览器会打开 Cloudflare 授权页面，点击 "Allow"。

**3. 构建项目**

```bash
npm run build
```

**4. 部署到 Cloudflare Pages**

```bash
npx wrangler pages deploy dist/
```

部署后会返回一个 `.pages.dev` 域名，例如：
```
https://xxxx-xxxx.pages.dev
```

#### 方式二：通过 GitHub 集成（自动部署）

**1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)**

**2. 进入 Workers & Pages**

左侧菜单 → "Workers & Pages"

**3. 创建应用程序**

点击 "Create application" → 选择 "Pages" → 点击 "Connect to Git"

**4. 连接 GitHub 仓库**

- 选择 `tmingjun/astro-startlight-blog`
- 点击 "Connect"

**5. 配置构建设置**

| 设置项 | 值 |
|:---|:---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |

**6. 部署**

点击 "Save and Deploy"，等待构建完成。

#### 方式三：通过命令行单独部署

```bash
# 构建
npm run build

# 创建 Cloudflare Pages 项目并部署
npx wrangler pages project create astro-startlight-blog
npx wrangler pages deploy dist/ --project-name=astro-startlight-blog
```

#### 配置自定义域名

**1. 在 Cloudflare Dashboard 中**

Workers & Pages → 选择你的项目 → "Custom domains" → "Set up a custom domain"

**2. 添加域名**

输入你的域名，按提示完成 DNS 配置即可。

## 更多资源

- [Starlight 官方文档](https://starlight.astro.build/)
- [Astro 官方文档](https://docs.astro.build)
- [Markdown 中文写作指南](https://www.markdownguide.org/)
