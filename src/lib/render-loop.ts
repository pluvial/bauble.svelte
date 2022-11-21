import type { Seconds } from './types';

export function createRenderLoop(f: (_: Seconds) => void) {
	let scheduled = false;
	let then: Seconds | null = null;
	return {
		schedule() {
			if (scheduled) {
				return;
			}
			scheduled = true;
			requestAnimationFrame((nowMS) => {
				const nowSeconds = (nowMS / 1000) as Seconds;
				scheduled = false;
				const elapsed = then == null ? 0 : nowSeconds - then;

				f(elapsed as Seconds);
				if (scheduled) {
					then = nowSeconds;
				} else {
					then = null;
				}
			});
		}
	};
}
