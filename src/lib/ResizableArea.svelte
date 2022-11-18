<script lang="ts">
	import { clamp } from './util';

	export let outputContainer: HTMLElement;

	let handlePointerAt = 0;
</script>

<div
	class="resize-handle output-resize-handle"
	title="double click to auto size"
	on:pointerdown={(e) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		handlePointerAt = e.screenY;
	}}
	on:dblclick={() => {
		outputContainer.style.flexBasis = '';
		outputContainer.style.maxHeight = '';
		// TODO: check this
		// outputContainer.style.flexBasis = null;
		// outputContainer.style.maxHeight = null;
	}}
	on:pointermove={(e) => {
		if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
			return;
		}
		const outputStyle = getComputedStyle(outputContainer);
		const verticalPadding =
			parseFloat(outputStyle.paddingTop) + parseFloat(outputStyle.paddingBottom);
		const oldHeight = outputContainer.offsetHeight - verticalPadding;
		const oldScrollTop = outputContainer.scrollTop;
		const handlePointerWasAt = handlePointerAt;
		handlePointerAt = e.screenY;
		const delta = handlePointerAt - handlePointerWasAt;
		outputContainer.style.flexBasis = `${oldHeight - delta}px`;
		outputContainer.style.maxHeight = '100%';
		outputContainer.scrollTop = clamp(
			oldScrollTop + delta,
			0,
			outputContainer.scrollHeight - outputContainer.offsetHeight
		);
	}}
/>
<pre class="output-container" bind:this={outputContainer} />

<style>
	.resize-handle {
		flex: none;
		flex-basis: 4px;
		touch-action: none;
	}

	.output-resize-handle {
		cursor: ns-resize;
		touch-action: none;
		background-color: var(--toolbar-bg);
		background-image: var(--horizontal-grip);
		flex: none;
		flex-basis: 4px;
	}

	.output-container:not(:empty) {
		padding: 8px;
	}
	.output-container {
		overflow: auto;
		max-height: 25%;
	}

	/* TODO: check this */
	/* .output-container .err {
		color: var(--red);
	} */

	.output-container {
		font-family: var(--monospace-family);
		font-size: var(--monospace-size);
	}

	@media all and (max-width: 512px) {
		.resize-handle {
			flex-basis: 12px;
		}
		.output-container {
			height: 1.5em;
		}
	}
</style>
