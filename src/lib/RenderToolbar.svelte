<script lang="ts">
	import type { Writable } from 'svelte/store';
	import Choices from './Choices.svelte';
	import Icon from './Icon.svelte';

	// TODO: render type should be an enum
	export let renderType: Writable<number>;
	export let quadView: Writable<boolean>;
	export let rotation: Writable<{ x: number; y: number }>;
	export let origin: Writable<{ x: number; y: number; z: number }>;
	export let zoom: Writable<number>;

	export let resetCamera: (
		rotation: Writable<{ x: number; y: number }>,
		origin: Writable<{ x: number; y: number; z: number }>,
		zoom: Writable<number>
	) => void;

	function toggleQuadView() {
		quadView.update((x) => !x);
	}
</script>

<div class="toolbar">
	<button title="Reset camera" on:click={() => resetCamera(rotation, origin, zoom)}>
		<Icon name="box" />
	</button>
	<button title="Toggle quad view" on:click={toggleQuadView}>
		<Icon name={$quadView ? 'grid-fill' : 'grid'} />
	</button>
	<div class="spacer" />
	<Choices
		selected={renderType}
		choices={[
			{ value: 0, icon: 'camera', title: 'Render normally' },
			{ value: 1, icon: 'magnet', title: 'Debug number of raymarching steps' },
			{ value: 2, icon: 'arrows-collapse', title: 'Debug surface distance' }
		]}
	/>
</div>

<style>
	.toolbar {
		width: 100%;
		height: var(--control-height);
		line-height: var(--control-height);
		display: flex;
		user-select: none;
		background-color: var(--window);
		flex: none;
		overflow-y: hidden;
		overflow-x: auto;
		color: var(--toolbar-fg);
		fill: var(--toolbar-fg);
		background-color: var(--toolbar-bg);
		background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1));
		box-sizing: border-box;
	}

	.toolbar:last-child {
		border-top: solid 1px rgba(0, 0, 0, 0.25);
	}

	.toolbar:not(:last-child) {
		border-bottom: solid 1px rgba(0, 0, 0, 0.25);
	}

	button:not(.hidden:first-child) + button {
		margin-left: -6px;
	}

	.spacer {
		flex: 1;
	}

	button {
		min-width: var(--control-height);
		border: none;
		cursor: pointer;
		background-color: initial;
	}

	button :global(svg) {
		padding: 4px;
		border-radius: 6px;
	}

	button:hover :global(svg) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	button:active :global(svg) {
		background-color: rgba(0, 0, 0, 0.2);
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	button :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>
