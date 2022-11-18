import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [{ default: file }, { default: preamble }] = await Promise.all([
		import('/docs/help.md?raw'),
		import('/docs/preamble.md?raw')
	]);
	const content = marked(file)
		.replaceAll('<pre><code>', '<div class="bauble-placeholder"><div class="script">')
		.replaceAll('</code></pre>', '</div></div>');
	// TODO: generate equivalent of pandoc --toc
	return { content, toc: '', preamble: marked(preamble) };
};
