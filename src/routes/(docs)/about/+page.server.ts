import { marked } from 'marked';

export const load = async () => {
	const { default: file } = await import('/docs/about.md?raw');
	return { content: marked(file) };
};
