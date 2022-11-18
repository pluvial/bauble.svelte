<script lang="ts">
	import { LoopMode, TimerState, type Timer } from './timer';
	import Choices from './Choices.svelte';
	import Icon from './Icon.svelte';
	import TimestampInput from './TimestampInput.svelte';

	export let timer: Timer;
	const state = timer.state;
	const t = timer.t;
</script>

<div class="toolbar">
	<button
		title={$state === TimerState.Playing ? 'Pause' : 'Play'}
		on:click={() => timer.playPause()}
	>
		<Icon name={$state === TimerState.Playing ? 'pause' : 'play'} />
	</button>
	<button title="Stop" on:click={() => timer.stop()}><Icon name="stop" /></button>
	<span title="Current timestamp" class="timestamp">{$t.toFixed(2)}</span>
	<div class="spacer" />
	<!-- <div class="scrubber"></div> -->
	<Choices
		selected={timer.loopMode}
		choices={[
			{ value: LoopMode.NoLoop, icon: 'arrow-bar-right', title: 'No loop' },
			{ value: LoopMode.Wrap, icon: 'repeat', title: 'Loop' },
			{ value: LoopMode.Reverse, icon: 'arrow-left-right', title: 'Loop back and forth' }
		]}
	/>
	<TimestampInput store={timer.loopStart} />
	<span class="text">to</span>
	<TimestampInput store={timer.loopEnd} />
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

	.toolbar button:not(.hidden:first-child) + button,
	.toolbar :global(label + label) {
		margin-left: -6px;
	}

	.toolbar .spacer {
		flex: 1;
	}
	/* .toolbar .scrubber {
		flex: 1;
		background-color: #8f8;
	} */
	.toolbar .timestamp {
		padding: 0 1ch;
	}

	.toolbar .text {
		padding: 0 4px;
	}

	.toolbar :global(fieldset) {
		display: inline;
		border: none;
		padding: none;
		white-space: nowrap;
	}

	.toolbar button {
		min-width: var(--control-height);
		border: none;
		cursor: pointer;
		background-color: initial;
	}

	.toolbar :global(fieldset label) {
		display: inline-block;
		height: 100%;
		cursor: pointer;
		min-width: var(--control-height);
		text-align: center;
	}

	.toolbar :global(fieldset input[type='radio']) {
		display: none;
	}

	.toolbar button :global(svg),
	.toolbar :global(fieldset input[type='radio'] + span),
	.toolbar :global(fieldset input[type='radio'] + svg) {
		padding: 4px;
		border-radius: 6px;
	}

	.toolbar :global(fieldset input[type='radio']:checked + span),
	.toolbar :global(fieldset input[type='radio']:checked + svg) {
		background-color: rgba(0, 0, 0, 0.15);
	}

	.toolbar button:hover :global(svg),
	.toolbar :global(fieldset label:hover input[type='radio'] + span),
	.toolbar :global(fieldset label:hover input[type='radio'] + svg) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.toolbar button:active :global(svg),
	.toolbar :global(fieldset label:hover input[type='radio']:checked + span),
	.toolbar :global(fieldset label:hover input[type='radio']:checked + svg) {
		background-color: rgba(0, 0, 0, 0.2);
	}

	.toolbar :global(fieldset) {
		display: flex;
		flex-direction: row;
	}
	.toolbar :global(fieldset label),
	.toolbar button {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toolbar :global(fieldset label svg),
	.toolbar button :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>
