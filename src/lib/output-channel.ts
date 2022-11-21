export function createOutputChannel() {
	let target: HTMLElement | null = null;
	return {
		print(text: string, isErr: boolean) {
			if (target == null) {
				if (isErr) {
					console.error(text);
				} else {
					console.log(text);
				}
			} else {
				const span = document.createElement('span');
				span.classList.toggle('err', isErr);
				span.appendChild(document.createTextNode(text));
				span.appendChild(document.createTextNode('\n'));
				target.appendChild(span);
			}
		},
		set target(value: HTMLElement | null) {
			target = value;
		}
	};
}

export type OutputChannel = ReturnType<typeof createOutputChannel>;
