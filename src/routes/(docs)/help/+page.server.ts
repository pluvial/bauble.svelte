import { marked, Renderer } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import type { PageServerLoad } from './$types';

const headings: { anchor: string; level: number; text: string }[] = [];

const renderer = {
	heading(text: string, level: number, raw: string): string | false {
		const anchor = raw
			.toLowerCase()
			.replaceAll(/[/?]/g, '')
			.replaceAll(/[^\w]+/g, '-');
		headings.push({
			anchor,
			level,
			text
		});
		return false;
	}
};

marked.use({ mangle: false }, gfmHeadingId(), { renderer });

export const load: PageServerLoad = async () => {
	const [{ default: file }, { default: preamble }] = await Promise.all([
		import('/docs/help.md?raw'),
		import('/docs/preamble.md?raw')
	]);
	const content = marked(file)
		.replaceAll('<pre><code>', '<div class="bauble-placeholder"><div class="script">')
		.replaceAll('</code></pre>', '</div></div>');
	const toc =
		headings.reduce(
			(state, { anchor, level, text }) => {
				const delimiter = level > state.level ? '<ul>' : level < state.level ? '</ul>' : '';
				const element = `<li><a href="#${anchor}">${text}</a></li>`;
				return { level, html: `${state.html}${delimiter}${element}` };
			},
			{ level: 0, html: '' }
		).html + '</ul>';
	return { content, toc, preamble: marked(preamble) };
};
