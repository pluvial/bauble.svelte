<script lang="ts">
	import { LoopMode, TimerState, type Timer } from './timer';
	import type { Seconds } from './types';
	import Choices from './Choices.svelte';
	import Icon from './Icon.svelte';
	import TimestampInput from './TimestampInput.svelte';

	export let timer: Timer;
	const { state, t } = timer;

	export let loopStart: Seconds;
	export let loopEnd: Seconds;
	export let loopMode: LoopMode;
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
		bind:selected={loopMode}
		choices={[
			{ value: LoopMode.NoLoop, icon: 'arrow-bar-right', title: 'No loop' },
			{ value: LoopMode.Wrap, icon: 'repeat', title: 'Loop' },
			{ value: LoopMode.Reverse, icon: 'arrow-left-right', title: 'Loop back and forth' }
		]}
	/>
	<TimestampInput bind:time={loopStart} />
	<span class="text">to</span>
	<TimestampInput bind:time={loopEnd} />
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

	.timestamp {
		font-family: var(--monospace-family);
		font-size: var(--monospace-size);
	}

	.spacer {
		flex: 1;
	}
	/* .scrubber {
		flex: 1;
		background-color: #8f8;
	} */
	.timestamp {
		padding: 0 1ch;
	}

	.text {
		padding: 0 4px;
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
