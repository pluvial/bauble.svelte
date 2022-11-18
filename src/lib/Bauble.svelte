<script context="module" lang="ts">
	export enum EvaluationState {
		Unknown,
		Success,
		EvaluationError,
		ShaderCompilationError
	}
</script>

<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import type { EditorView } from '@codemirror/view';
	import type { Property } from 'csstype';
	import { vec2 } from 'gl-matrix';
	import type { BaubleModule } from 'bauble-runtime';
	import type { default as OutputChannel } from './output-channel';
	import { Timer } from './timer';
	import { mod } from './util';
	import AnimationToolbar from './AnimationToolbar.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import RenderToolbar from './RenderToolbar.svelte';
	import ResizableArea from './ResizableArea.svelte';
	import { onMount } from 'svelte';

	export let runtime: BaubleModule;
	export let outputChannel: OutputChannel;
	export let initialScript: string;
	export let focusable: boolean;
	export let canSave: boolean;
	export let size: { width: number; height: number };

	const defaultCamera = {
		origin: {
			x: 0,
			y: 0,
			z: 0
		},
		rotation: {
			x: 0.125,
			y: -0.125
		},
		zoom: 1.0
	};

	const cameraRotateSpeed = 1 / 512;
	const cameraZoomSpeed = 0.01;
	const cameraPanSpeed = 1.5;

	interface GestureEvent extends TouchEvent {
		scale: number;
	}

	const resetCamera = (
		rotation: Writable<{ x: number; y: number }>,
		origin: Writable<{ x: number; y: number; z: number }>,
		zoom: Writable<number>
	) => {
		// TODO: batch?
		rotation.set(defaultCamera.rotation);
		origin.set(defaultCamera.origin);
		zoom.set(defaultCamera.zoom);
	};

	enum Interaction {
		Rotate,
		PanXY,
		PanZY,
		PanXZ,
		ResizeSplit
	}

	let canvasContainer: HTMLDivElement;
	let editorContainer: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let editor: EditorView;
	let outputContainer: HTMLElement;

	let isGesturing = false;
	let gestureEndedAt = 0;

	const canvasSize = writable(size);
	const pixelRatio = writable(window.devicePixelRatio);
	const imageRendering = writable<Property.ImageRendering>('auto');
	$: canvasResolution = {
		width: $pixelRatio * $canvasSize.width,
		height: $pixelRatio * $canvasSize.height
	};
	const renderType = writable(0);
	const quadView = writable(false);
	const quadSplitPoint = writable({ x: 0.5, y: 0.5 });
	const zoom = writable(defaultCamera.zoom);
	const rotation = writable(defaultCamera.rotation);
	const origin = writable(defaultCamera.origin);
	const scriptDirty = writable(true);
	const evaluationState = writable(EvaluationState.Unknown);
	const isAnimation = writable(false);
	const isVisible = writable(false);

	const timer = new Timer();

	const intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			$isVisible = entry.isIntersecting;
		}
	});

	onMount(() => {
		// TODO
	});

	let canvasPointerAt = [0, 0];
	let interactionPointer: number | null = null;
	let interaction: Interaction | null = null;

	const getRelativePoint = (e: MouseEvent) => ({
		x: e.offsetX / canvas.offsetWidth,
		y: e.offsetY / canvas.offsetHeight
	});
	const isOnSplitPoint = (e: MouseEvent) => {
		const splitPoint = $quadSplitPoint;
		const size = vec2.fromValues(canvas.offsetWidth, canvas.offsetHeight);
		const splitPointPixels = vec2.fromValues(splitPoint.x, splitPoint.y);
		vec2.mul(splitPointPixels, splitPointPixels, size);
		return vec2.distance(splitPointPixels, [e.offsetX, e.offsetY]) < 10;
	};

	const setCursorStyle = (e: PointerEvent) => {
		if (interaction == null) {
			canvas.style.cursor = $quadView && isOnSplitPoint(e) ? 'move' : 'grab';
		} else if (interaction === Interaction.ResizeSplit) {
			canvas.style.cursor = 'move';
		} else {
			canvas.style.cursor = 'grabbing';
		}
	};

	const getInteraction = (e: MouseEvent) => {
		if ($quadView) {
			if (isOnSplitPoint(e)) {
				return Interaction.ResizeSplit;
			} else {
				const relativePoint = getRelativePoint(e);
				const splitPoint = $quadSplitPoint;
				if (relativePoint.y < splitPoint.y) {
					if (relativePoint.x < splitPoint.x) {
						return Interaction.Rotate;
					} else {
						return Interaction.PanXZ;
					}
				} else {
					if (relativePoint.x < splitPoint.x) {
						return Interaction.PanXY;
					} else {
						return Interaction.PanZY;
					}
				}
			}
		} else {
			return Interaction.Rotate;
		}
	};

	const onPointerDown = (e: PointerEvent) => {
		if (interactionPointer != null) {
			return;
		}
		e.preventDefault();
		if (focusable) {
			canvas.focus();
		}
		canvasPointerAt = [e.offsetX, e.offsetY];
		canvas.setPointerCapture(e.pointerId);
		interactionPointer = e.pointerId;
		interaction = getInteraction(e);
		setCursorStyle(e);
	};

	const onPointerUp = (e: PointerEvent) => {
		e.preventDefault();
		if (e.pointerId === interactionPointer) {
			interactionPointer = null;
			interaction = null;
		}
		setCursorStyle(e);
	};

	const onDblClick = (e: MouseEvent) => {
		if ($quadView) {
			switch (getInteraction(e)) {
				case Interaction.Rotate:
					// TODO: batch?
					$rotation = defaultCamera.rotation;
					$zoom = defaultCamera.zoom;
					break;
				case Interaction.PanXY:
					origin.update(({ z }) => ({
						x: defaultCamera.origin.x,
						y: defaultCamera.origin.y,
						z
					}));
					break;
				case Interaction.PanZY:
					origin.update(({ x }) => ({
						x,
						y: defaultCamera.origin.y,
						z: defaultCamera.origin.z
					}));
					break;
				case Interaction.PanXZ:
					origin.update(({ y }) => ({
						x: defaultCamera.origin.x,
						y,
						z: defaultCamera.origin.z
					}));
					break;
				case Interaction.ResizeSplit:
					$quadSplitPoint = { x: 0.5, y: 0.5 };
					break;
			}
		} else {
			resetCamera(rotation, origin, zoom);
		}
	};

	const onPointerMove = (e: PointerEvent) => {
		setCursorStyle(e);

		if (e.pointerId !== interactionPointer) {
			return;
		}
		e.preventDefault();
		const pointerWasAt = canvasPointerAt;
		canvasPointerAt = [e.offsetX, e.offsetY];

		if (isGesturing) {
			return;
		}
		// if you were just trying to zoom, we don't want to do a little tiny
		// pan as you lift your second finger. so we wait 100ms before we allow
		// panning to continue
		if (performance.now() - gestureEndedAt < 100) {
			return;
		}

		const size = $canvasSize;
		const deltaX = (canvasPointerAt[0] - pointerWasAt[0]) * (size.width / canvas.clientWidth);
		const deltaY = (canvasPointerAt[1] - pointerWasAt[1]) * (size.height / canvas.clientHeight);
		const panRate = $zoom * cameraPanSpeed;

		switch (interaction!) {
			case Interaction.Rotate: {
				rotation.update(({ x, y }) => ({
					x: mod(x - deltaX * cameraRotateSpeed, 1.0),
					y: mod(y - deltaY * cameraRotateSpeed, 1.0)
				}));
				break;
			}
			case Interaction.PanXY: {
				origin.update(({ x, y, z }) => ({
					x: x - deltaX * panRate,
					y: y + deltaY * panRate,
					z: z
				}));
				break;
			}
			case Interaction.PanZY: {
				origin.update(({ x, y, z }) => ({
					x: x,
					y: y + deltaY * panRate,
					z: z - deltaX * panRate
				}));
				break;
			}
			case Interaction.PanXZ: {
				origin.update(({ x, y, z }) => ({
					x: x - deltaX * panRate,
					y: y,
					z: z - deltaY * panRate
				}));
				break;
			}
			case Interaction.ResizeSplit: {
				const deltaX = (canvasPointerAt[0] - pointerWasAt[0]) / canvas.clientWidth;
				const deltaY = (canvasPointerAt[1] - pointerWasAt[1]) / canvas.clientHeight;
				quadSplitPoint.update(({ x, y }) => ({
					x: x + deltaX,
					y: y + deltaY
				}));
				break;
			}
		}
	};

	const onWheel = (e: WheelEvent) => {
		if (focusable && document.activeElement !== canvas) {
			return;
		}
		e.preventDefault();
		// Linux Firefox users who do not set MOZ_USE_XINPUT2
		// will report very large values of deltaY, resulting
		// in very choppy scrolling. I don't really know a good
		// way to fix this without explicit platform detection.
		zoom.update((x) => Math.max(0, x + cameraZoomSpeed * e.deltaY));
	};

	let initialZoom = 1;
	const onGestureStart = () => {
		initialZoom = $zoom;
		isGesturing = true;
	};
	const onGestureChange = (e: GestureEvent) => {
		$zoom = Math.max(0, initialZoom / e.scale);
	};
	const onGestureEnd = () => {
		isGesturing = false;
		gestureEndedAt = performance.now();
	};

	let codeContainer: HTMLDivElement;
	let handlePointerAt = [0, 0];
	const onHandlePointerDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		handlePointerAt = [e.screenX, e.screenY];
	};
	const onHandleDblClick = () => {
		// TODO: width or height!
		codeContainer.style.flexBasis = `var(--canvas-width)`;
		canvasContainer.style.flexBasis = 'var(--canvas-width)';
	};
	const onHandlePointerMove = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
		if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
			return;
		}
		const isVertical = getComputedStyle(e.currentTarget.parentElement!).flexDirection === 'column';
		const containerStyle = getComputedStyle(canvasContainer);

		const padding = isVertical
			? parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom)
			: parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
		const oldSize =
			(isVertical ? canvasContainer.offsetHeight : canvasContainer.offsetWidth) - padding;

		const handlePointerWasAt = handlePointerAt;
		handlePointerAt = [e.screenX, e.screenY];
		const delta = isVertical
			? handlePointerWasAt[1] - handlePointerAt[1]
			: handlePointerAt[0] - handlePointerWasAt[0];
		codeContainer.style.flexBasis = `0`;
		canvasContainer.style.flexBasis = `${oldSize - delta}px`;
	};
</script>

<div
	class="bauble"
	style:--canvas-width="{$canvasSize.width}px"
	style:--canvas-height="{$canvasSize.height}px"
>
	<div class="canvas-container" bind:this={canvasContainer}>
		<RenderToolbar {renderType} {quadView} {rotation} {origin} {zoom} {resetCamera} />
		<canvas
			bind:this={canvas}
			class="render-target"
			style:image-rendering={$imageRendering}
			width={canvasResolution.width}
			height={canvasResolution.height}
			tabindex={focusable ? 0 : undefined}
			on:wheel={onWheel}
			on:dblclick={onDblClick}
			on:pointerdown={onPointerDown}
			on:pointerup={onPointerUp}
			on:pointermove={onPointerMove}
			on:gesturestart={onGestureStart}
			on:gesturechange={onGestureChange}
			on:gestureend={onGestureEnd}
		/>
		<AnimationToolbar {timer} />
	</div>
	<div
		class="resize-handle canvas-resize-handle"
		title="double click to auto size"
		on:pointerdown={onHandlePointerDown}
		on:pointermove={onHandlePointerMove}
		on:dblclick={onHandleDblClick}
	/>
	<div class="code-container" bind:this={codeContainer}>
		<EditorToolbar state={$evaluationState} />
		<div class="editor-container" bind:this={editorContainer} />
		<ResizableArea bind:outputContainer />
	</div>
</div>

<style>
	.bauble {
		--control-height: 40px;
		--horizontal-grip: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.15),
			rgba(0, 0, 0, 0),
			rgba(0, 0, 0, 0.2)
		);
		--vertical-grip: linear-gradient(
			to right,
			rgba(0, 0, 0, 0.15),
			rgba(0, 0, 0, 0),
			rgba(0, 0, 0, 0.2)
		);

		height: 100%;
		display: flex;
		overflow: hidden;
		flex-direction: row-reverse;
	}

	.bauble > * {
		overflow: hidden;
	}

	.bauble .code-container {
		display: flex;
		flex-direction: column;
		/* TODO: this should be width OR height depending on orientation */
		flex: 1 1 var(--canvas-width);
	}

	.bauble .canvas-container {
		display: flex;
		justify-content: start;
		align-items: center;
		flex-direction: column;
		/* TODO: this should be width OR height depending on orientation */
		flex: 0 1 var(--canvas-width);
	}

	.bauble .editor-container {
		overflow: hidden;
		display: flex;
		flex: 1;
	}

	.bauble .editor-container > :global(*) {
		flex: 1;
		max-width: 100%; /* required for horizontal scrolling */
	}

	.bauble .resize-handle {
		flex: none;
		flex-basis: 4px;
		touch-action: none;
	}

	.bauble .canvas-resize-handle {
		cursor: ew-resize;
		background-color: var(--toolbar-bg);
		background-image: var(--vertical-grip);
	}

	.bauble canvas {
		max-width: calc(min(100%, var(--canvas-width)));
		max-height: calc(min(100% - 2 * var(--control-height), var(--canvas-height)));
		touch-action: none;
	}

	@media all and (max-width: 512px) {
		.bauble {
			flex-direction: column;
		}
		.bauble .resize-handle {
			flex-basis: 12px;
		}
		.bauble .canvas-resize-handle {
			background: var(--horizontal-grip);
			cursor: ns-resize;
		}
	}
</style>
