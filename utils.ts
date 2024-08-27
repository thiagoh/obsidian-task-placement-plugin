/* eslint-disable @typescript-eslint/no-unused-vars */

export const DEBUG_ENABLED = false;

export function debug(...args: any[]) {
	if (DEBUG_ENABLED) {
		console.log(['task-placement-plugin:', ...args]);
	}
}

export interface IEditor {
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
		if (!firstCheckboxFound && isCheckboxChecked(text)) {
			firstCheckboxFound = true;
			firstLineChanged = i;
		} else if (firstCheckboxFound && isCheckboxUnchecked(text)) {
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
    if (isNestedCheckbox(firstLine)) {
      return getEntry(editor, initialI - 1);
    }
		if (!isTaskEntry(firstLine)) {
			return { text: firstLine, nextLine: i + 1, previousLine: i - 1 };
		}
		i++;
		text = firstLine;
		while (i < editor.lineCount()) {
			const line = editor.getLine(i);
			if (isNestedCheckbox(line)) {
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
			if (isNestedCheckbox(line)) {
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
	function append(buffer: string, entry: string) {
		return buffer + (buffer.length > 0 ? '\n' : '') + entry;
	}
	let completeTasksBuffer = '';
	let incompleteTasksBuffer = '';
	{
		let i = 0;
		while (i < editor.lineCount()) {
			const { text: entry, nextLine, previousLine } = getEntry(editor, i);
			if (isCheckboxChecked(entry)) {
				completeTasksBuffer = append(completeTasksBuffer, entry);
				debug('checked entry', `'${entry}'`);
				// } else if (isNewLineCheckboxUnchecked(entry)) {
				// 	completeTasksBuffer = '\t' + entry + completeTasksBuffer;
			} else if (isNewLineCheckboxUnchecked(entry)) {
				debug('newLineCheckboxUnchecked entry', `'${entry}'`);
				const { text: previousEntryText } = getEntry(editor, previousLine);
				if (isCheckboxChecked(previousEntryText)) {
					completeTasksBuffer = append(completeTasksBuffer, '  ' + entry);
				} else {
					incompleteTasksBuffer = append(incompleteTasksBuffer, entry);
				}
			} else {
				debug('else entry', entry);
				incompleteTasksBuffer = append(incompleteTasksBuffer, entry);
			}
			i = Math.max(i + 1, nextLine);
		}
	}
	debug('completeTasksBuffer', `'${completeTasksBuffer}'`);
	debug('incompleteTasksBuffer', `'${incompleteTasksBuffer}'`);
	return incompleteTasksBuffer + (incompleteTasksBuffer.length > 0 && completeTasksBuffer.length > 0 ? '\n' : '') + completeTasksBuffer;
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
			if (isCheckboxUnchecked(entry)) {
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
	return isCheckboxChecked(line) || isCheckboxUnchecked(line);
}

export function isCheckboxChecked(line: string) {
	return line.startsWith('- [x]');
}

export function isNestedCheckbox(line: string) {
	return /^\s+- \[(x| )\].*/.test(line);
}

export function isCheckboxUnchecked(line: string) {
	return line.startsWith('- [ ]');
}

export function isNewLineCheckboxUnchecked(line: string) {
	return /^- \[ \]\s*$/.test(line);
}
