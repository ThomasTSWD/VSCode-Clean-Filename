import * as path from 'path';
import * as vscode from 'vscode';
import { applyRenames, planRenames } from './clean';

const MAX_LISTED = 10;

function list(lines: string[]): string {
	const shown = lines.slice(0, MAX_LISTED);
	if (lines.length > MAX_LISTED) {
		shown.push(`... and ${lines.length - MAX_LISTED} more`);
	}
	return shown.join('\n');
}

async function cleanFileNames(uri?: vscode.Uri, selection?: vscode.Uri[]): Promise<void> {
	const targets = selection?.length
		? selection
		: [uri ?? vscode.window.activeTextEditor?.document.uri].filter(
			(target): target is vscode.Uri => target !== undefined
		);
	if (targets.length === 0) {
		vscode.window.showErrorMessage('Select a file or a folder to clean.');
		return;
	}
	if (targets.some((target) => target.scheme !== 'file')) {
		vscode.window.showErrorMessage('Only files on disk can be renamed.');
		return;
	}

	try {
		const plan = await planRenames(targets.map((target) => target.fsPath));
		const { renames, skipped } = plan;

		if (renames.length === 0) {
			vscode.window.showInformationMessage('Nothing to clean: all file names are already clean.');
			return;
		}

		if (renames.length > 1 || plan.includesDirectory) {
			const confirmed = await vscode.window.showWarningMessage(
				`Rename ${renames.length} file(s)?`,
				{
					modal: true,
					detail: list(renames.map(({ from, to }) => `${path.basename(from)} -> ${path.basename(to)}`)),
				},
				'Rename'
			);
			if (confirmed !== 'Rename') {
				return;
			}
		}

		const failed = await applyRenames(renames);
		const problems = [...failed, ...skipped];
		const done = renames.length - failed.length;
		if (problems.length > 0) {
			vscode.window.showWarningMessage(
				`${done} file(s) renamed, ${problems.length} skipped: ${list(
					problems.map((item) => `${path.basename(item.path)} (${item.reason})`)
				)}`
			);
		} else {
			vscode.window.showInformationMessage(`${done} file(s) renamed.`);
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`Clean Filename failed: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('clean-filename.clean', cleanFileNames)
	);
}

export function deactivate() {}
