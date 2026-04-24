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
                    // Si c'est un fichier, nettoyez son nom
                    await cleanFileName(selectedPath);
                } else if (stat.isDirectory()) {
                    // Si c'est un dossier, nettoyez les fichiers de manière récursive
                    await cleanFileNamesRecursive(selectedPath);
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

// Fonction pour nettoyer le nom d'un fichier
async function cleanFileName(filePath) {
    const fileName = path.basename(filePath);
    const cleanFileName = cleanFileNameString(fileName);
    const newFilePath = path.join(path.dirname(filePath), cleanFileName);

    // Si le nom change, renommer le fichier
    if (filePath !== newFilePath) {
        await fs.promises.rename(filePath, newFilePath);
    }
}

// Fonction récursive pour nettoyer les fichiers dans les sous-dossiers
async function cleanFileNamesRecursive(folderPath) {
    const files = await fs.promises.readdir(folderPath, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(folderPath, file.name);

        if (file.isFile()) {
            // Si c'est un fichier, nettoyez son nom
            await cleanFileName(filePath);
        } else if (file.isDirectory()) {
            // Si c'est un sous-dossier, appliquez la récursion
            await cleanFileNamesRecursive(filePath);
        }
    }
}

// Fonction pour nettoyer un nom de fichier en remplaçant les caractères indésirables
function cleanFileNameString(fileName) {
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);

    const cleaned = baseName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")     // Supprime les accents
        .replace(/[^a-zA-Z0-9._-]/g, "-")    // Garde uniquement alphanum, point, tiret, underscore
        .replace(/-+/g, "-")                  // Réduit les tirets multiples
        .replace(/^[-_.]+|[-_.]+$/g, "");     // Supprime tirets/points/underscores en début et fin

    return cleaned + extension.toLowerCase();
}

function deactivate() {
    // Nettoyage des ressources si nécessaire
}

module.exports = {
    activate,
    deactivate,
};
