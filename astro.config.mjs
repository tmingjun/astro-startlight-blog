// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: '个人文档库',
			logo: {
				src: './src/assets/houston.webp',
			},
			head: [
				{
					tag: 'meta',
					attrs: { name: 'description', content: '个人文档库 - 记录学习与成长' },
				},
			],
			editLink: {
				baseUrl: 'https://github.com/withastro/starlight/edit/main/',
			},
			social: [],
			sidebar: [
				{
					label: '指南',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Linux 内核',
					autogenerate: { directory: 'kernel' },
				},
				{
					label: 'Linux 存储栈',
					autogenerate: { directory: 'storage' },
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
