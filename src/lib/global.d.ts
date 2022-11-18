interface GestureEvent extends TouchEvent {
	scale: number;
}

declare namespace svelte.JSX {
	interface HTMLAttributes<T> {
		ongesturestart?: (event: GestureEvent) => void;
		ongesturechange?: (event: GestureEvent) => void;
		ongestureend?: (event: GestureEvent) => void;
	}
}
