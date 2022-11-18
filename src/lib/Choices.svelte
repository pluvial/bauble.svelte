<script lang="ts">
	import type { Writable } from 'svelte/store';
	import Icon from './Icon.svelte';

	type T = any;

	interface ChoiceDescription<T> {
		title: string;
		value: T;
		icon: string;
	}

	export let selected: Writable<T>;
	export let choices: ChoiceDescription<T>[];
</script>

<fieldset>
	{#each choices as { title, value, icon }}
		<label {title}>
			<input
				type="radio"
				autocomplete="off"
				{value}
				checked={$selected === value}
				on:change={() => ($selected = value)}
			/>
			<Icon name={icon} />
		</label>
	{/each}
</fieldset>
