<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ preamble, toc, content } = data);
</script>

{@html preamble}

{@html toc}

{@html content}
