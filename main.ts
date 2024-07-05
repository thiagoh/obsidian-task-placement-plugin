/* eslint-disable @typescript-eslint/no-unused-vars */
import { Editor, MarkdownView, Plugin } from 'obsidian';

export default class MoveCheckedLinesToBottomPlugin extends Plugin {
	async onload() {
		this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {
			console.debug('Event: editor-change');
			this.moveCheckedLinesToBottom();
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'print-cursor-line-info-command',
			name: 'Print cursor and line info',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				console.debug('cursor', cursor);
				const line = editor.getLine(cursor.line);
				console.debug('line', line);
				console.debug('editor', editor);
				// this.moveCheckedLinesToBottom();
			},
		});
	}

	onunload() {}

	private moveCheckedLinesToBottom() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const activeEditor = activeView?.editor;

		function getDivisorLine(editor: Editor): number {
			for (let i = editor.lineCount() - 1; i > 0; i--) {
				const line = editor.getLine(i);
				if (line === '----') {
					// divisor line found
					return i;
				}
			}
			return -1;
		}

		if (activeEditor) {
			const divisorLineIx = getDivisorLine(activeEditor);
			const divisorLinePlacementIx = divisorLineIx < 0 ? activeEditor.lineCount() : divisorLineIx;
			let change = false;
			let firstLineChanged = -1;
			for (let i = 0; i < activeEditor.lineCount(); i++) {
				const line = activeEditor.getLine(i);
				if (i < divisorLinePlacementIx && line.startsWith('- [x]')) {
					change = true;
					firstLineChanged = firstLineChanged < 0 ? i : firstLineChanged;
				} else if (i > divisorLinePlacementIx && line.startsWith('- [ ]')) {
					change = true;
				}
			}

			if (!change) {
				console.debug('No need to change. Returning...');
				return;
			}
			console.debug('Need to change');

			let bottomBuffer = '';
			let buffer = '';
			for (let i = 0; i < divisorLinePlacementIx; i++) {
				const line = activeEditor.getLine(i);
				if (line.startsWith('- [x]')) {
					bottomBuffer = '\n' + line + bottomBuffer;
				} else {
					buffer += (buffer.length > 0 ? '\n' : '') + line;
				}
			}
			for (let i = divisorLinePlacementIx + 1; i < activeEditor.lineCount(); i++) {
				const line = activeEditor.getLine(i);
				if (line.startsWith('- [ ]')) {
					buffer = line + '\n' + buffer;
				} else {
					bottomBuffer += '\n' + line;
				}
			}
			activeEditor.setValue(buffer + '\n----' + bottomBuffer);
			const line = activeEditor.getLine(Math.max(firstLineChanged, 0));
			activeEditor.setCursor({ line: Math.max(firstLineChanged, 0), ch: line.length });
			console.debug('cursor placed to ', line.length);
		}
	}
}
