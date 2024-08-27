/* eslint-disable @typescript-eslint/no-unused-vars */
import { adjustTasksPositions, getChangeInfo, getEntry, IEditor, isNestedCheckbox, isNewLineCheckboxUnchecked } from './utils';

class TestEditor implements IEditor {
	private lines: string[];
	constructor(text: string) {
		this.lines = text.split('\n');
	}

	getLine(line: number): string {
		return this.lines[line];
	}

	lineCount(): number {
		return this.lines.length;
	}
}

describe('getEntry', () => {
	test('getEntry returns single line when theres no nested entries', () => {
		const content = `- [ ] e
- [ ] c
- [ ] b
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);

		const { text, nextLine, previousLine } = getEntry(editor, 0);
		expect(text).toBe(`- [ ] e`);
		expect(nextLine).toBe(1);
		expect(previousLine).toBe(-1);
	});

	test('getEntry returns lines that include nested entries', () => {
		const content = `- [ ] e
	- [ ] f
	- [ ] g
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { text, nextLine, previousLine } = getEntry(editor, 0);
		expect(text).toBe(
			`- [ ] e
	- [ ] f
	- [ ] g`,
		);
		expect(nextLine).toBe(3);
		expect(previousLine).toBe(-1);
	});

	test('getEntry returns lines that include nested entries including sub nesting', () => {
		const content = `- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { text, nextLine, previousLine } = getEntry(editor, 0);
		expect(text).toBe(
			`- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i`,
		);
		expect(nextLine).toBe(5);
		expect(previousLine).toBe(-1);
	});
	test('getEntry starts from non zero line position returns single line when theres no nested entries', () => {
		const content = `- [ ] a
- [ ] e
- [ ] b
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);

		const { text, nextLine, previousLine } = getEntry(editor, 1);
		expect(text).toBe(`- [ ] e`);
		expect(nextLine).toBe(2);
		expect(previousLine).toBe(0);
	});

	test('getEntry starts from non zero line position returns lines that include nested entries', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { text, nextLine, previousLine } = getEntry(editor, 1);
		expect(text).toBe(
			`- [ ] e
	- [ ] f
	- [ ] g`,
		);
		expect(nextLine).toBe(4);
		expect(previousLine).toBe(0);
	});

	test('getEntry starts from non zero line position returns lines that include nested entries including sub nesting', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { text, nextLine, previousLine } = getEntry(editor, 1);
		expect(text).toBe(
			`- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i`,
		);
		expect(nextLine).toBe(6);
		expect(previousLine).toBe(0);
	});
});

describe('getChangeInfo', () => {
	test('getChangeInfo with all checkbox unchecked should not require changes', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(false);
		expect(firstLineChanged).toBe(-1);
	});
	test('getChangeInfo with nested checkbox checked should not require change', () => {
		const content = `- [ ] x
- [ ] e
	- [x] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(false);
		expect(firstLineChanged).toBe(-1);
	});
	test('getChangeInfo with subnested checkbox checked should not require change', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
		- [x] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(false);
		expect(firstLineChanged).toBe(-1);
	});

	test('getChangeInfo with first checkbox checked should require changes', () => {
		const content = `- [x] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(true);
		expect(firstLineChanged).toBe(0);
	});

	test('getChangeInfo with second line checkbox checked should require changes', () => {
		const content = `- [ ] x
- [x] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(true);
		expect(firstLineChanged).toBe(1);
	});

	test('getChangeInfo with second last line checkbox checked should require changes', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [x] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(true);
		expect(firstLineChanged).toBe(8);
	});

	test('getChangeInfo with last line checkbox checked should not require changes', () => {
		const content = `- [ ] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] d
- [x] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(false);
		expect(firstLineChanged).toBe(-1);
	});

	test('getChangeInfo with last line checkbox checked should not require changes', () => {
		const content = `- [ ] x
- [x] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [x] b
		- [ ] c
- [x] d
- [ ] a`;
		const editor = new TestEditor(content);
		const { change, firstLineChanged } = getChangeInfo(editor);
		expect(change).toBe(true);
		expect(firstLineChanged).toBe(1);
	});
});

describe('isNestedCheckbox', () => {
	test('isNestedCheckbox should return false for root level checkbox without nesting', () => {
		const content = `- [ ] e`;
		expect(isNestedCheckbox(content)).toBe(false);
	});
	test('isNestedCheckbox should return false for root level checkbox with nesting', () => {
		const content = `- [ ] e
  - [ ] d`;
		expect(isNestedCheckbox(content)).toBe(false);
	});
	test('isNestedCheckbox should return false for root level checkbox', () => {
		const content = `- [ ] e
  - [ ] d
    - [ ] a`;
		expect(isNestedCheckbox(content)).toBe(false);
	});
	test('isNestedCheckbox should return true for nested checkbox', () => {
		const content = ` - [ ] e
    - [ ] d
      - [ ] a`;
		expect(isNestedCheckbox(content)).toBe(true);
	});
	test('isNestedCheckbox should return true for subnested checkbox', () => {
		const content = `   - [ ] e
      - [ ] d
        - [ ] a`;
		expect(isNestedCheckbox(content)).toBe(true);
	});
});

describe('isNewLineCheckboxUnchecked', () => {
	test('isNewLineCheckboxUnchecked should return false when line does not end with space', () => {
		expect(isNewLineCheckboxUnchecked(`- [ ] e`)).toBe(false);
	});
	test('isNewLineCheckboxUnchecked should return false when line does not end with space(.)', () => {
		expect(isNewLineCheckboxUnchecked(`- [ ] .`)).toBe(false);
	});
	test('isNewLineCheckboxUnchecked should return false when brackets have more than one space', () => {
		expect(isNewLineCheckboxUnchecked(`- [  ] `)).toBe(false);
	});
	test('isNewLineCheckboxUnchecked should return false when brackets have more than one space (no space at the end)', () => {
		expect(isNewLineCheckboxUnchecked(`- [  ]`)).toBe(false);
	});
	test('isNewLineCheckboxUnchecked should return true when theres no space at the end', () => {
    expect(isNewLineCheckboxUnchecked(`- [ ]`)).toBe(true);
	});
  test('isNewLineCheckboxUnchecked should return true when theres space at the end', () => {
    expect(isNewLineCheckboxUnchecked(`- [ ] `)).toBe(true);
	});
  test('isNewLineCheckboxUnchecked should return true when theres multiple spaces at the end', () => {
    expect(isNewLineCheckboxUnchecked(`- [ ]    `)).toBe(true);
	});
  test('isNewLineCheckboxUnchecked should return true when theres tab at the end', () => {
		expect(isNewLineCheckboxUnchecked(`- [ ]\t`)).toBe(true);
	});
  test('isNewLineCheckboxUnchecked should return true when theres multiple tabs at the end', () => {
		expect(isNewLineCheckboxUnchecked(`- [ ]\t\t`)).toBe(true);
	});
});

describe('adjustTasksPositions', () => {
	test('adjustTasksPositions should ', () => {
		const content = `- [x] x
- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [x] d
- [ ] a`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(`- [ ] e
	- [ ] f
	- [ ] g
		- [ ] h
		- [ ] i
- [ ] b
		- [ ] c
- [ ] a
- [x] x
- [x] d`);
	});
	test('adjustTasksPositions should ', () => {
		const content = `- [x] 11
- [ ] 22
- [x] 33
- [ ] 44`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] 22
- [ ] 44
- [x] 11
- [x] 33`,
		);
	});
	test('adjustTasksPositions should move nested tasks together to the bottom', () => {
		const content = `- [x] 1
  - [ ] 1.1
  - [ ] 1.2
- [ ] 2
- [x] 3
- [ ] 4`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] 2
- [ ] 4
- [x] 1
  - [ ] 1.1
  - [ ] 1.2
- [x] 3`,
		);
	});
	test('adjustTasksPositions should guarantee order after move', () => {
		const content = `- [x] 2
- [x] 3
- [x] 4
- [ ] 1
  - [ ] 1.1
  - [ ] 1.2`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] 1
  - [ ] 1.1
  - [ ] 1.2
- [x] 2
- [x] 3
- [x] 4`,
		);
	});
	test('adjustTasksPositions should guarantee order after move at the bottom of list', () => {
		const content = `- [ ] a
- [ ] b
- [ ] c
- [ ] d
- [x] 11
- [ ] 22
- [x] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] a
- [ ] b
- [ ] c
- [ ] d
- [ ] 22
- [x] 11
- [x] 33`,
		);
	});
	test('adjustTasksPositions should move first task all the way to bottom if checked', () => {
		const content = `- [x] a
- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33
- [x] a`,
		);
	});
	test('adjustTasksPositions should move first task with nesting all the way to bottom if checked', () => {
		const content = `- [x] a
  - [ ] nested a.1
  - [ ] nested a.2
- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33
- [x] a
  - [ ] nested a.1
  - [ ] nested a.2`,
		);
	});
	test('adjustTasksPositions should move first task with nesting and subnesting all the way to bottom if checked', () => {
		const content = `- [x] a
  - [ ] nested a.1
    - [ ] subnested a.1.1
  - [ ] nested a.2
- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] b
- [ ] c
- [ ] d
- [ ] 11
- [ ] 22
- [ ] 33
- [x] a
  - [ ] nested a.1
    - [ ] subnested a.1.1
  - [ ] nested a.2`,
		);
	});
	test('adjustTasksPositions should not move when nesting is checked', () => {
		const content = `- [ ] a
  - [x] nested a.1
    - [ ] subnested a.1.1
  - [ ] nested a.2
- [ ] b`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(content);
	});
	test('adjustTasksPositions should not move when subnesting is checked', () => {
		const content = `- [ ] a
	  - [ ] nested a.1
	    - [x] subnested a.1.1
	  - [ ] nested a.2
	- [ ] b
	- [ ] c
	- [ ] d
	- [ ] 11
	- [ ] 22
	- [ ] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(content);
	});

	test('adjustTasksPositions should nest if adding a line after a complete task and before a complete task', () => {
		const content = `- [ ] b
- [x] 11
- [ ]
- [x] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] b
- [x] 11
  - [ ]
- [x] 33`,
		);
	});
	test('adjustTasksPositions should after a complete task at the end of the list', () => {
		const content = `- [ ] b
- [x] 11
- [ ]`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] b
- [x] 11
  - [ ]`,
		);
	});
	test('adjustTasksPositions should ...', () => {
		const content = `- [ ] d
- [ ] c
- [ ] b
- [ ] a
- [ ] 11
- [x] 22
- [ ]
- [x] 33`;
		const editor = new TestEditor(content);
		expect(adjustTasksPositions(editor)).toBe(
			`- [ ] d
- [ ] c
- [ ] b
- [ ] a
- [ ] 11
- [x] 22
  - [ ]
- [x] 33`,
		);
	});
});
