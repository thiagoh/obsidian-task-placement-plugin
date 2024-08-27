/* eslint-disable @typescript-eslint/no-unused-vars */
import { Editor, MarkdownView, Plugin } from 'obsidian';
import { getChangeInfo, getEntry, adjustTasksPositions, debug } from 'utils';

export default class MoveCheckedLinesToBottomPlugin extends Plugin {
	async onload() {
		this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {
			debug('Event: editor-change');
			this.moveCheckedLinesToBottom();
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'print-cursor-line-info-command',
			name: 'Print cursor and line info',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				debug('cursor', cursor);
				const line = editor.getLine(cursor.line);
				debug('line', line);
				debug('editor', editor);
			},
		});
	}

	onunload() {}

	private moveCheckedLinesToBottom() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const activeEditor = activeView?.editor;

		if (activeEditor) {
			debug('value', activeEditor.getValue());
			const { change, firstLineChanged } = getChangeInfo(activeEditor);
			if (!change) {
				debug('No need to change. Returning...');
				return;
			}
			debug('Need to change');

			const content = adjustTasksPositions(activeEditor);
			debug('content', content);
			activeEditor.setValue(content);
			// activeEditor.setValue(buffer + '\n----' + bottomBuffer);
			const { text: line } = getEntry(activeEditor, Math.max(firstLineChanged, 0));
			activeEditor.setCursor({ line: Math.max(firstLineChanged, 0), ch: line.length });
			debug('cursor placed to ', line.length);
		}
	}
}
