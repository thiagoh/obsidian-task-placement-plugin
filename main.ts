/* eslint-disable @typescript-eslint/no-unused-vars */
import { Editor, MarkdownView, Plugin } from 'obsidian';
import {
	getChangeInfo,
	getLastIncompleteTask,
	getEntry,
	IEditor,
	isCheckboxChecked,
	isCheckboxUnchecked,
	isNestedCheckbox,
	isNewLineCheckboxUnchecked,
  adjustTasksPositions,
} from 'utils';

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
				console.debug('task-placement-plugin: cursor', cursor);
				const line = editor.getLine(cursor.line);
				console.debug('task-placement-plugin: line', line);
				console.debug('task-placement-plugin: editor', editor);
			},
		});
	}

	onunload() {}

	private moveCheckedLinesToBottom() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const activeEditor = activeView?.editor;

		if (activeEditor) {
			console.debug('task-placement-plugin: value', activeEditor.getValue());
			const { change, firstLineChanged } = getChangeInfo(activeEditor);
			if (!change) {
				console.debug('task-placement-plugin: No need to change. Returning...');
				return;
			}
			console.debug('task-placement-plugin: Need to change');

      const content = adjustTasksPositions(activeEditor);
			console.debug('task-placement-plugin: content', content);
			activeEditor.setValue(content);
			// activeEditor.setValue(buffer + '\n----' + bottomBuffer);
			const { text: line } = getEntry(activeEditor, Math.max(firstLineChanged, 0));
			activeEditor.setCursor({ line: Math.max(firstLineChanged, 0), ch: line.length });
			console.debug('task-placement-plugin: cursor placed to ', line.length);
		}
	}
}
