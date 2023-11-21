# Changelog
This is a list of changes made in MU-FRET to the original FRET code, for the purpose of making it easier to re-integrate the project back into FRET down the line.

### Cathal's changes

1. [Commit d2cf4cd](https://github.com/valu3s-mu/mu-fret/pull/23/commits/d2cf4cd648372c1eda20bedc0211cc8786055b8f)
    Replaced a suspected typo of bitwise & with logical &&
	
2. [Commit 51c4387](https://github.com/NASA-SW-VnV/fret/commit/51c4387ef1f2fc93c2fdf8082f39dac6c0849774)
    Changed the size of the node labels in the hierarchical cluster diagram in the CSS

3. [Commit 1cedaba](https://github.com/NASA-SW-VnV/fret/commit/1cedabaaf72f1a0baa5d3842878071c3447fc6a4)
    Changed the colours of the hierarchical cluster diagram
	
4. [Commit be62f37](https://github.com/valu3s-mu/mu-fret/commit/be62f37ab5d680f7092bc91116d54cd466e58093)
    Add legend to hierarchical diagram to explain the colours


### Oisín's changes

1. [Commit 4d5e3e5](https://github.com/valu3s-mu/mu-fret/commit/4d5e3e5e7868b77945c5247a1c189d9934400135)
    Edited DisplayRequirementDialog.js to fix the title bar and buttons geting duplicated and/or cut off
    This is likely to cause a merge conflict since I think the main repo has also changed this, but when I pulled
    in their solution it didn't work.

2. [Commit 58a66e3](https://github.com/valu3s-mu/mu-fret/commit/58a66e35879107859bcb9069197873892bb0dac9)
    Edited DisplayRequirementDialog.js and SortableTable.js to add a refactoring button to the dialogue.
    This is mainly just changing our code but I thought I should include it in here.

3. [Commit 9308101](https://github.com/valu3s-mu/mu-fret/commit/930810147189a851b5a999496aaf00ac087bc753)
    Edited RequirementDialogs.js so we can refactor from the front page via the Cluster Diagram.
    Just adding new code.

4. []()
    Created RenameProjectDialog.js. Edited MainView.js to add Rename Project buttons to the project selection menu. Added the import for RenameProjectDialog, two state variables ('renameProjectDialogOpen' and 'projectTobeRenamed'), three functions ('Handle', 'Open' and 'Close' for the rename dialog) and added rename buttons to the project selection dropdown.