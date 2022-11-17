import fs from 'fs/promises';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

const readFile = (path: string) =>
	fs.readFile(new URL(path, import.meta.url), { encoding: 'utf-8' });

export const load: PageServerLoad = async () => {
	const file = await readFile('content.md');
	return { content: marked(file) };
};
