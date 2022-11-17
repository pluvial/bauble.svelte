<script>
	import Header from './Header.svelte';
	import './styles.css';
</script>

<svelte:head>
	<title>Bauble</title>
</svelte:head>

<Header />

<main>
	<slot />
</main>

<style>
	main {
		padding: 0.5em;
		display: block;
		margin: 0 auto;
		max-width: 768px;
	}

	main > * + :global(h1),
	main > * + :global(h2),
	main > * + :global(h3),
	main > * + :global(p),
	main > * + :global(ul),
	main > * + :global(div) {
		margin-top: 1em;
	}
</style>
