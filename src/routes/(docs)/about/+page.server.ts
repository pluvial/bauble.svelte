import { marked } from 'marked';

marked.use({ headerIds: false, mangle: false });

export const load = async () => {
	const { default: file } = await import('/docs/about.md?raw');
	return { content: marked(file) };
};
