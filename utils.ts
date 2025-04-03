/* eslint-disable @typescript-eslint/no-unused-vars */

export const DEBUG_ENABLED = false;

export function debug(...args: any[]) {
	if (DEBUG_ENABLED) {
		console.log(['task-placement-plugin:', ...args]);
	}
}

export interface IEditor {
	getValue(): string;

	getLine(line: number): string;

	lineCount(): number;
}

export function getChangeInfo(editor: IEditor) {
	let change = false;
	let firstCheckboxFound = false;
	let firstLineChanged = -1;

	let i = 0;
	while (i < editor.lineCount() && !change) {
		const { text, nextLine } = getEntry(editor, i);
		if (!firstCheckboxFound && isRootTaskChecked(text)) {
			firstCheckboxFound = true;
			firstLineChanged = i;
		} else if (firstCheckboxFound && isRootTaskUnchecked(text)) {
			change = true;
		}
		i = Math.max(i + 1, nextLine);
	}

	return {
		change,
		firstLineChanged: change ? firstLineChanged : -1,
	};
}

export function getEntry(editor: IEditor, initialI: number): { text: string; nextLine: number; previousLine: number } {
	if (initialI < 0) {
		return { text: '', nextLine: 0, previousLine: -1 };
	}
	let text, nextLine, previousLine;
	{
		let i = initialI;
		const firstLine = editor.getLine(i);
		if (isNestedTask(firstLine)) {
			return getEntry(editor, initialI - 1);
		}
		if (!isTaskEntry(firstLine)) {
			return { text: firstLine, nextLine: i + 1, previousLine: i - 1 };
		}
		i++;
		text = firstLine;
		while (i < editor.lineCount()) {
			const line = editor.getLine(i);
			if (isNestedTask(line)) {
				text += '\n' + line;
				i++;
			} else {
				break;
			}
		}
		nextLine = i;
	}

	{
		let i = initialI - 1;
		while (i > 0) {
			const line = editor.getLine(i);
			if (isNestedTask(line)) {
				i--;
			} else {
				break;
			}
		}
		previousLine = i;
	}

	return { text: text, nextLine, previousLine };
}

export function adjustTasksPositions(editor: IEditor) {
	const originalContent = editor.getValue();
	const lines = originalContent.split('\n');

	const incompleteTasksBuffer: string[] = [];
	const completeTasksBuffer: string[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (isRootTaskChecked(line)) {
			const taskBlock = [line];
			i++;
			// Collect nested tasks
			while (i < lines.length && isNestedTask(lines[i])) {
				taskBlock.push(lines[i]);
				i++;
			}
			completeTasksBuffer.push(...taskBlock);
		} else if (isNewLineCheckboxUnchecked(line)) {
			if (completeTasksBuffer.length > 0 && isRootTaskChecked(completeTasksBuffer[completeTasksBuffer.length - 1])) {
				completeTasksBuffer.push('  ' + line);
			} else {
				incompleteTasksBuffer.push(line);
			}
			i++;
		} else {
			incompleteTasksBuffer.push(line);
			i++;
		}
	}

	const newContent = [...incompleteTasksBuffer, ...completeTasksBuffer].join('\n');
	debug('newContent', newContent);
	return newContent;
}

export function checkNestedTasks(editor: IEditor): string {
	const lines = editor.getValue().split('\n');
	let modified = false;

	function getIndentationLevel(line: string): number {
		const match = line.match(/^\s*/);
		return match ? match[0].length : 0;
	}

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes('[x]')) {
			// If any task (root or nested) is checked
			const currentIndent = getIndentationLevel(lines[i]);
			let j = i + 1;

			// Check all nested tasks with greater indentation
			while (j < lines.length) {
				const nextIndent = getIndentationLevel(lines[j]);
				if (nextIndent <= currentIndent) break; // Break if we're back to same or lower indentation

				if (isNestedTask(lines[j]) && lines[j].includes('[ ]')) {
					lines[j] = lines[j].replace('[ ]', '[x]');
					modified = true;
				}
				j++;
			}
		}
	}

	const newContent = modified ? lines.join('\n') : editor.getValue();
	debug('newContent', newContent);
	return newContent;
}

export function getLastIncompleteTask(editor: IEditor) {
	function _getLastUncheckedRootCheckbox(editor: IEditor): number {
		let i = editor.lineCount() - 1;
		while (i > 0) {
			const line = editor.getLine(i);
			if (!isTaskEntry(line)) {
				i--;
				continue;
			}

			const { text: entry, previousLine } = getEntry(editor, i);
			if (isRootTaskUnchecked(entry)) {
				return Math.max(i, 0);
			}
			i = Math.min(i - 1, previousLine);
		}
		return -1;
	}
	const divisorLineIx = _getLastUncheckedRootCheckbox(editor);
	return divisorLineIx < 0 ? editor.lineCount() - 1 : divisorLineIx;
}

export function isTaskEntry(line: string) {
	return isRootTaskChecked(line) || isRootTaskUnchecked(line);
}

export function isRootTaskChecked(line: string) {
	return line.startsWith('- [x]');
}

export function isNestedTask(line: string) {
	return /^\s+- \[(x| )\].*/.test(line);
}

export function isRootTaskUnchecked(line: string) {
	return line.startsWith('- [ ]');
}

export function isNewLineCheckboxUnchecked(line: string) {
	return /^- \[ \]\s*$/.test(line);
}
