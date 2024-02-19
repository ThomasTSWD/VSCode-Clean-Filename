const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
	let disposable = vscode.commands.registerCommand(
		"extension.cleanFileNames",
		async (uri) => {
			if (!uri) {
				vscode.window.showErrorMessage(
					"Aucun fichier ou dossier sélectionné pour nettoyer les noms de fichiers."
				);
				return;
			}

			const selectedPath = uri.fsPath;

			try {
				const stat = await fs.promises.stat(selectedPath);
				if (stat.isFile()) {
					await cleanFileName(selectedPath);
				} else if (stat.isDirectory()) {
					await cleanFileNames(selectedPath);
				}
				vscode.window.showInformationMessage(
					"Les noms de fichiers ont été nettoyés avec succès."
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Une erreur s'est produite : ${error.message}`
				);
			}
		}
	);

	context.subscriptions.push(disposable);
}

async function cleanFileName(filePath) {
	const fileName = path.basename(filePath);
	const cleanFileName = cleanFileNameString(fileName);
	const newFilePath = path.join(path.dirname(filePath), cleanFileName);

	if (filePath !== newFilePath) {
		await fs.promises.rename(filePath, newFilePath);
	}
}

async function cleanFileNames(folderPath) {
	const files = await fs.promises.readdir(folderPath);
	for (const file of files) {
		const filePath = path.join(folderPath, file);
		const cleanFileName = cleanFileNameString(file);
		const newFilePath = path.join(folderPath, cleanFileName);

		if (filePath !== newFilePath) {
			await fs.promises.rename(filePath, newFilePath);
		}
	}
}
function cleanFileNameString(fileName) {
	// Extraire l'extension du nom de fichier
	const extension = path.extname(fileName);
	const baseName = path.basename(fileName, extension);

	const normalizedBaseName = baseName
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w\s'-.]/g, "-");
	// Remplace les espaces par des tirets
	const withoutSpaces = normalizedBaseName.replace(/\s+/g, "-");
	// Supprime les tirets multiples
	const singleHyphens = withoutSpaces.replace(/-+/g, "-");
	// Supprime les tirets à la fin du nom de fichier
	const finalFileName = singleHyphens.replace(/-$/, "");
	// Reconstruire le nom de fichier en ajoutant l'extension à la fin
	const cleanedFileName = finalFileName + extension;
	return cleanedFileName;
}

function deactivate() {
	// Nettoyage des ressources
}

module.exports = {
	activate,
	deactivate,
};
