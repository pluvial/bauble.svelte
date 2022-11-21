<script lang="ts">
	import { onDestroy, onMount, SvelteComponent } from 'svelte';
	import type { BaubleModule } from 'bauble-runtime';
	import { Bauble, createOutputChannel } from '$lib';
	import type { PageData } from './$types';
	import './styles.css';

	export let data: PageData;
	$: ({ preamble, toc, content } = data);

	const outputChannel = createOutputChannel();

	const baubleOpts = {
		print(x: string) {
			outputChannel.print(x, false);
		},
		printErr(x: string) {
			outputChannel.print(x, true);
		}
	};

	let runtime: BaubleModule;

	const components: SvelteComponent[] = [];

	onMount(async () => {
		try {
			const { default: InitializeWasm } = await import('bauble-runtime');
			runtime = await InitializeWasm(baubleOpts);

			const intersectionObserver = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}
					const placeholder = entry.target;
					intersectionObserver.unobserve(entry.target);
					const initialScript = placeholder.textContent ?? '';
					placeholder.innerHTML = '';
					const component = new Bauble({
						target: placeholder,
						props: {
							runtime,
							outputChannel,
							initialScript,
							focusable: true,
							canSave: false,
							size: { width: 256, height: 256 }
						}
					});
					components.push(component);
				}
			});
			for (const placeholder of document.querySelectorAll('.bauble-placeholder')) {
				intersectionObserver.observe(placeholder);
			}
		} catch (error) {
			console.error(error);
		}
	});

	onDestroy(() => components.forEach((component) => component.$destroy()));
</script>

{@html preamble}

{@html toc}

{@html content}
