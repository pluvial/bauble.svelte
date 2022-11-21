<script lang="ts">
	import Icon from './Icon.svelte';

	type T = any;

	interface ChoiceDescription<T> {
		title: string;
		value: T;
		icon: string;
	}

	export let selected: T;
	export let choices: ChoiceDescription<T>[];
</script>

<fieldset>
	{#each choices as { title, value, icon }}
		<label {title}>
			<input
				type="radio"
				autocomplete="off"
				{value}
				checked={selected === value}
				on:change={() => (selected = value)}
			/>
			<Icon name={icon} />
		</label>
	{/each}
</fieldset>

<style>
	fieldset {
		display: flex;
		flex-direction: row;
		border: none;
		padding: none;
		white-space: nowrap;
	}

	label {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		cursor: pointer;
		min-width: var(--control-height);
		text-align: center;
	}

	label + label {
		margin-left: -6px;
	}

	input {
		display: none;
	}

	input + :global(span),
	input + :global(svg) {
		padding: 4px;
		border-radius: 6px;
	}

	input:checked + :global(span),
	input:checked + :global(svg) {
		background-color: rgba(0, 0, 0, 0.15);
	}

	label:hover input + :global(span),
	label:hover input + :global(svg) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	label:hover input:checked + :global(span),
	label:hover input:checked + :global(svg) {
		background-color: rgba(0, 0, 0, 0.2);
	}

	label :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>
