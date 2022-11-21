import { get, writable } from 'svelte/store';
import type { Seconds } from './types';
import { TAU } from './util';

export enum TimerState {
	Ambivalent,
	Playing,
	Paused
}

export enum LoopMode {
	NoLoop = 'no-loop',
	Wrap = 'wrap',
	Reverse = 'reverse'
}

function clampTime(
	t_: Seconds,
	loopStart_: Seconds,
	loopEnd_: Seconds,
	loopMode: LoopMode
): [Seconds, number] {
	let t = t_ as number;
	const loopStart = loopStart_ as number;
	const loopEnd = loopEnd_ as number;
	let rate = 0;
	if (t > loopEnd) {
		switch (loopMode) {
			case LoopMode.NoLoop:
				break;
			case LoopMode.Wrap:
				t = loopStart + (t - loopEnd);
				break;
			case LoopMode.Reverse:
				t = loopEnd - (t - loopEnd);
				rate = -1;
				break;
		}
	}
	if (t < loopStart) {
		switch (loopMode) {
			case LoopMode.NoLoop:
				break;
			case LoopMode.Wrap:
				t = loopStart;
				break;
			case LoopMode.Reverse:
				t = loopStart + (loopStart - t);
				rate = 1;
				break;
		}
	}
	return [t as Seconds, rate];
}

export function createTimer(
	loopStart = () => 0 as Seconds,
	loopEnd = () => TAU as Seconds,
	loopMode = () => LoopMode.NoLoop
) {
	const t = writable(0 as Seconds);
	const state = writable(TimerState.Ambivalent);
	let rate = 1;
	return {
		t,
		state,

		stop() {
			// TODO: need to batch?
			t.set(loopStart());
			state.set(TimerState.Paused);
			rate = 1;
		},

		playPause() {
			state.update((state) =>
				state === TimerState.Playing ? TimerState.Paused : TimerState.Playing
			);
		},

		updateLoop(loopStart: Seconds, loopEnd: Seconds, loopMode: LoopMode) {
			if (loopMode != LoopMode.Reverse) {
				rate = 1;
			}
			const [tClamped, rateClamped] = clampTime(get(t), loopStart, loopEnd, loopMode);
			if (rateClamped !== 0) {
				rate = rateClamped;
			}
			t.set(tClamped);
		},

		tick(delta: Seconds, isAnimation: boolean) {
			if (isAnimation && get(state) === TimerState.Ambivalent) {
				state.set(TimerState.Playing);
			}

			const [tClamped, rateClamped] = clampTime(
				((get(t) as number) + rate * (delta as number)) as Seconds,
				loopStart(),
				loopEnd(),
				loopMode()
			);

			t.set(tClamped);
			if (rateClamped !== 0) {
				rate = rateClamped;
			}
		}
	};
}

export type Timer = ReturnType<typeof createTimer>;
