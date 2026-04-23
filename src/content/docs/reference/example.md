---
title: 配置参考
description: 文档库配置选项参考
---

本文档提供 Starlight 配置选项的参考。

## 配置选项

### title

网站标题，显示在导航栏和页面标题中。

```js
title: '我的文档库'
```

### description

网站描述，用于 SEO 和 meta 标签。

```js
description: '这是我的个人文档库'
```

### logo

网站 Logo，可以是图片路径或包含 light/dark 变体的对象。

```js
logo: {
  src: './src/assets/logo.png',
}
```

### social

社交链接数组，支持多种图标。

```js
social: [
  { icon: 'github', label: 'GitHub', href: 'https://github.com/yourusername' },
  { icon: 'twitter', label: 'Twitter', href: 'https://twitter.com/yourusername' },
]
```

### sidebar

侧边栏配置，支持手动定义和自动生成。

```js
sidebar: [
  {
    label: '指南',
    items: [
      { label: '快速开始', slug: 'guides/getting-started' },
    ],
  },
  {
    label: '参考',
    autogenerate: { directory: 'reference' },
  },
]
```

### customCss

自定义样式文件路径。

```js
customCss: ['./src/styles/custom.css']
```

## 更多资源

- [Starlight 官方文档](https://starlight.astro.build/)
- [Astro 文档](https://docs.astro.build/)
