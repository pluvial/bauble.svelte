import { derived, get, writable } from 'svelte/store';
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

export class Timer {
	t = writable(0 as Seconds);
	loopStart = writable(0 as Seconds);
	loopEnd = writable(TAU as Seconds);
	loopMode = writable(LoopMode.NoLoop);
	state = writable(TimerState.Ambivalent);
	private rate = 1;

	playPause() {
		this.state.update((state) =>
			state === TimerState.Playing ? TimerState.Paused : TimerState.Playing
		);
	}

	stop() {
		// TODO: batch?
		this.t.set(get(this.loopStart));
		this.state.set(TimerState.Paused);
		this.rate = 1;
	}

	constructor() {
		derived([this.loopStart, this.loopEnd, this.loopMode], (stores) => stores).subscribe(
			([loopStart, loopEnd, loopMode]) => {
				if (loopMode != LoopMode.Reverse) {
					this.rate = 1;
				}
				const [t, rate] = clampTime(get(this.t), loopStart, loopEnd, loopMode);
				if (rate !== 0) {
					this.rate = rate;
				}
				this.t.set(t);
			}
		);
		// TODO: clean up effect
	}

	tick(delta: Seconds, isAnimation: boolean) {
		if (isAnimation && get(this.state) === TimerState.Ambivalent) {
			this.state.set(TimerState.Playing);
		}

		const [t, rate] = clampTime(
			((get(this.t) as number) + this.rate * (delta as number)) as Seconds,
			get(this.loopStart),
			get(this.loopEnd),
			get(this.loopMode)
		);

		this.t.set(t);
		if (rate !== 0) {
			this.rate = rate;
		}
	}
}
