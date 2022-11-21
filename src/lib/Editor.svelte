<script lang="ts">
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
	import { indentWithTab } from '@codemirror/commands';
	import { syntaxTree, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
	import type { SyntaxNode } from '@lezer/common';
	import { tags } from '@lezer/highlight';
	import { janet } from 'codemirror-lang-janet';
	import { EditorState, EditorSelection, Transaction } from '@codemirror/state';
	import Big from 'big.js';
	import * as Storage from './storage';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let initialScript: string;
	export let canSave: boolean;
	export let editor: EditorView;

	let editorContainer: HTMLDivElement;

	function save({ state }: StateCommandInput) {
		console.log('saving...');
		const script = state.doc.toString();
		if (script.trim().length > 0) {
			Storage.saveScript(script);
		} else {
			Storage.deleteScript();
		}
		return true;
	}

	function isNumberNode(node: SyntaxNode) {
		return node.type.name === 'Number';
	}

	interface StateCommandInput {
		state: EditorState;
		dispatch: (_: Transaction) => void;
	}

	function alterNumber({ state, dispatch }: StateCommandInput, amount: Big) {
		const range = state.selection.ranges[state.selection.mainIndex];
		const tree = syntaxTree(state);

		let node = tree.resolveInner(range.head, -1);
		if (!isNumberNode(node)) {
			node = tree.resolveInner(range.head, 1);
		}
		if (!isNumberNode(node)) {
			return false;
		}

		// TODO: we shouldn't be doing any floating point math; we should
		// parse this as a decimal number and increment it as a decimal number
		const numberText = state.sliceDoc(node.from, node.to);
		let number;
		try {
			number = Big(numberText);
		} catch (e) {
			console.error('unable to parse number: ', numberText);
			return false;
		}
		const decimalPointIndex = numberText.indexOf('.');
		const digitsAfterDecimalPoint =
			decimalPointIndex < 0 ? 0 : numberText.length - decimalPointIndex - 1;
		const increment = Big('10').pow(-digitsAfterDecimalPoint);

		const newNumber = number.add(amount.times(increment));
		const newNumberText = newNumber.toFixed(digitsAfterDecimalPoint);

		const lengthDifference = newNumberText.length - numberText.length;

		dispatch(
			state.update({
				changes: {
					from: node.from,
					to: node.to,
					insert: newNumberText
				},
				selection: EditorSelection.single(node.from, node.to + lengthDifference),
				scrollIntoView: true,
				userEvent: 'alterNumber'
			})
		);
		return true;
	}

	const highlightStyle = HighlightStyle.define([
		{ tag: tags.keyword, color: 'var(--purple)' },
		{ tag: tags.atom, color: 'var(--foreground)' },
		{ tag: tags.number, color: 'var(--blue)' },
		{ tag: tags.comment, color: 'var(--comment)' },
		{ tag: tags.null, color: 'var(--purple)' },
		{ tag: tags.bool, color: 'var(--purple)' },
		{ tag: tags.string, color: 'var(--green)' }
	]);

	const theme = EditorView.theme({
		'&': {
			color: 'var(--foreground)',
			backgroundColor: 'var(--background)'
		},
		'.cm-content': {
			padding: '0',
			caretColor: 'var(--foreground)'
		},
		'.cm-cursor': {
			borderLeftColor: 'var(--foreground)'
		},
		'.cm-activeLine': {
			backgroundColor: 'initial'
		},
		'&.cm-focused .cm-activeLine': {
			backgroundColor: 'var(--line)'
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'initial'
		},
		'&.cm-focused .cm-activeLineGutter': {
			backgroundColor: 'var(--selection)'
		},
		'.cm-selectionMatch': {
			outline: 'solid 1px var(--comment)',
			borderRadius: '2px',
			backgroundColor: 'initial'
		},
		'&.cm-focused .cm-matchingBracket': {
			outline: 'solid 1px var(--green)',
			borderRadius: '2px',
			color: 'var(--green)',
			backgroundColor: 'initial'
		},
		'&.cm-focused .cm-nonmatchingBracket': {
			outline: 'solid 1px var(--red)',
			borderRadius: '2px',
			color: 'var(--red)',
			backgroundColor: 'initial'
		},
		// slightly subtler as you type; i dunno
		// "&.cm-focused .cm-activeLine .cm-matchingBracket": {
		//   outline: 'none',
		// },
		'.cm-foldPlaceholder': {
			outline: 'solid 1px var(--comment)',
			border: 'none',
			width: '2ch',
			display: 'inline-block',
			margin: '0',
			padding: '0',
			textAlign: 'center',
			borderRadius: '2px',
			backgroundColor: 'var(--background)',
			color: 'var(--comment)'
		},
		'&.cm-focused .cm-selectionBackground, ::selection': {
			backgroundColor: 'var(--selection)'
		},
		'.cm-gutters': {
			backgroundColor: 'var(--line)',
			color: 'var(--comment)',
			border: 'none'
		}
		// TODO: style the "find/replace" box
	});

	let ctrlClickedAt = 0;
	const isTryingToEngageNumberDrag = () => performance.now() - ctrlClickedAt < 100;

	onMount(() => {
		const keyBindings = [indentWithTab];
		if (canSave) {
			keyBindings.push({ key: 'Mod-s', run: save });
		}

		editor = new EditorView({
			extensions: [
				basicSetup,
				janet(),
				keymap.of(keyBindings),
				EditorView.updateListener.of(function (viewUpdate: ViewUpdate) {
					if (viewUpdate.docChanged) {
						dispatch('change');
					}
				}),
				theme,
				syntaxHighlighting(highlightStyle)
			],
			parent: editorContainer,
			doc: initialScript
		});

		if (canSave) {
			setInterval(function () {
				save(editor);
			}, 30 * 1000);

			document.addEventListener('pagehide', () => {
				save(editor);
			});

			let savedBefore = false;
			// iOS Safari doesn't support beforeunload,
			// but it does support unload.
			window.addEventListener('beforeunload', () => {
				savedBefore = true;
				save(editor);
			});

			window.addEventListener('unload', () => {
				if (!savedBefore) {
					save(editor);
				}
			});
		}
	});
</script>

<div
	class="editor-container"
	bind:this={editorContainer}
	on:pointerdown={(e) => {
		if ((e.buttons === 1 || e.buttons === 2) && e.ctrlKey) {
			ctrlClickedAt = performance.now();
			editorContainer.setPointerCapture(e.pointerId);
			e.preventDefault();
		}
	}}
	on:contextmenu={(e) => {
		if (isTryingToEngageNumberDrag()) {
			e.preventDefault();
		}
	}}
	on:pointermove={(e) => {
		if (editorContainer.hasPointerCapture(e.pointerId)) {
			alterNumber(editor, Big(e.movementX).times('1'));
		}
	}}
/>

<svelte:body
	on:pointermove={(e) => {
		// There is a bug in Firefox where ctrl-click fires as
		// a pointermove event instead of a pointerdown event,
		// and then will not respect setPointerCapture() when
		// called from the pointermove event.
		//
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1504210
		//
		// So on Firefox you have to use an actual right-click.
		// It's very annoying. This is an *okay* workaround.
		if (!editor.hasFocus) {
			return;
		}
		if (e.shiftKey && e.metaKey) {
			alterNumber(editor, Big(e.movementX).times('1'));
		}
	}}
/>

<style>
	.editor-container {
		overflow: hidden;
		display: flex;
		flex: 1;
	}

	.editor-container > :global(*) {
		flex: 1;
		max-width: 100%; /* required for horizontal scrolling */
	}
</style>
