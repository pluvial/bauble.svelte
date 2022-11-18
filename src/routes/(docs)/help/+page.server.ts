import fs from 'fs/promises';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

const readFile = (path: string) =>
	fs.readFile(new URL(path, import.meta.url), { encoding: 'utf-8' });

export const load: PageServerLoad = async () => {
	const [file, preamble] = await Promise.all([readFile('content.md'), readFile('preamble.md')]);
	const content = marked(file)
		.replaceAll('<pre><code>', '<div class="bauble-placeholder"><div class="script">')
		.replaceAll('</code></pre>', '</div></div>');
	// TODO: generate equivalent of pandoc --toc
	return { content, toc: '', preamble: marked(preamble) };
};
