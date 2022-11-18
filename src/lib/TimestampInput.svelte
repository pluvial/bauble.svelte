<script lang="ts">
	import type { Writable } from 'svelte/store';
	import type { Seconds } from './types';

	export let store: Writable<Seconds>;

	function onChange(e: Event) {
		$store = parseInt((e.currentTarget as HTMLInputElement).value, 10) as Seconds;
	}
</script>

<input inputmode="numeric" value={$store.toFixed(2)} autocomplete="off" on:change={onChange} />

<style>
	input[inputmode='numeric'] {
		text-align: center;
		border: none;
		width: 6ch;
		color: var(--toolbar-fg);
		background-color: var(--toolbar-bg);
		box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);
		border-radius: 2px;
		margin: 4px 0;
	}

	input[inputmode='numeric']:last-child {
		margin-right: 4px;
	}
</style>
