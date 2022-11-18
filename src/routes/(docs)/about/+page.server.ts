import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { default: file } = await import('/docs/about.md?raw');
	return { content: marked(file) };
};
