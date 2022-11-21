<script lang="ts">
	import { EvaluationState } from './Bauble.svelte';
	import Icon from './Icon.svelte';

	export let state: EvaluationState;
</script>

<div class="toolbar">
	<div class="spacer" />
	{#if state === EvaluationState.Unknown}
		<div title="Compilation unknown" class="indicator compilation-unknown">
			<Icon name="emoji-neutral" />
		</div>
	{:else if state == EvaluationState.Success}
		<div title="Compilation success" class="indicator compilation-success">
			<Icon name="emoji-smile" />
		</div>
	{:else if state == EvaluationState.EvaluationError}
		<div title="Compilation error" class="indicator compilation-error">
			<Icon name="emoji-frown" />
		</div>
	{:else if state == EvaluationState.ShaderCompilationError}
		<div title="Shader compilation error" class="indicator compilation-error">
			<Icon name="emoji-angry" />
		</div>
	{/if}
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

	.spacer {
		flex: 1;
	}

	.indicator {
		min-width: var(--control-height);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.indicator :global(svg) {
		border-radius: 12px;
		padding: 2px;
		width: 20px;
		height: 20px;
	}

	.indicator.compilation-error :global(svg) {
		background-color: var(--red);
		fill: var(--toolbar-bg);
	}
</style>
