<script lang="ts">
	import type { Seconds } from './types';

	export let time: Seconds;

	let value = time.toFixed(2);

	function onChange() {
		value = Number(value).toFixed(2);
		time = Number(value) as Seconds;
	}
</script>

<input inputmode="numeric" bind:value autocomplete="off" on:change={onChange} />

<style>
	input {
		text-align: center;
		border: none;
		width: 6ch;
		color: var(--toolbar-fg);
		background-color: var(--toolbar-bg);
		box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);
		border-radius: 2px;
		margin: 4px 0;
		font-family: var(--monospace-family);
		font-size: var(--monospace-size);
	}

	input:last-child {
		margin-right: 4px;
	}
</style>
