<script lang="ts">
	import type { BaubleModule } from 'bauble-runtime';
	import type { OutputChannel } from '$lib';
	import type { Timer, LoopMode, TimerState } from '$lib/timer';

	export let runtime: BaubleModule;
	export let outputChannel: OutputChannel;
	export let initialScript: string;
	export let focusable: boolean;
	export let canSave: boolean;
	export let size: { width: number; height: number };

	enum EvaluationState {
		Unknown,
		Success,
		EvaluationError,
		ShaderCompilationError
	}

	interface GestureEvent extends TouchEvent {
		scale: number;
	}

	// declare global {
	// 	interface HTMLElementEventMap {
	// 		gesturestart: GestureEvent;
	// 		gesturechange: GestureEvent;
	// 		gestureend: GestureEvent;
	// 	}
	// }

	interface ChoiceDescription<T> {
		title: string;
		value: T;
		icon: string;
	}

	interface AnimationToolbarProps {
		timer: Timer;
	}

	enum Interaction {
		Rotate,
		PanXY,
		PanZY,
		PanXZ,
		ResizeSplit
	}
</script>

<div />
