import * as fs from 'fs/promises';
import * as path from 'path';

const IGNORED_DIRECTORIES = new Set(['node_modules']);

// Letters that Unicode decomposition (NFD) cannot reduce to ASCII.
const TRANSLITERATIONS: Record<string, string> = {
	'ß': 'ss', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE',
	'ø': 'o', 'Ø': 'O', 'đ': 'd', 'Đ': 'D', 'ł': 'l', 'Ł': 'L',
};

export interface Rename {
	from: string;
	to: string;
}

export interface Skipped {
	path: string;
	reason: string;
}

export interface Plan {
	renames: Rename[];
	skipped: Skipped[];
	includesDirectory: boolean;
}

function sanitize(value: string): string {
	return value
		.replace(/[ßæÆœŒøØđĐłŁ]/g, (char) => TRANSLITERATIONS[char])
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/-+/g, '-');
}

/**
 * Returns the cleaned name, or undefined when there is nothing to clean
 * (hidden file) or nothing left once cleaned.
 */
export function cleanFileName(fileName: string): string | undefined {
	if (fileName.startsWith('.')) {
		return undefined;
	}
	const extension = path.extname(fileName);
	const baseName = fileName.slice(0, fileName.length - extension.length);
	const cleaned = sanitize(baseName).replace(/^[-_.]+|[-_.]+$/g, '');
	if (cleaned === '') {
		return undefined;
	}
	return cleaned + sanitize(extension).toLowerCase();
}

async function collectFiles(directory: string, files: string[]): Promise<void> {
	for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isFile()) {
			files.push(entryPath);
		} else if (
			entry.isDirectory() &&
			!entry.name.startsWith('.') &&
			!IGNORED_DIRECTORIES.has(entry.name)
		) {
			await collectFiles(entryPath, files);
		}
	}
}

async function isSameFile(a: string, b: string): Promise<boolean> {
	const [statA, statB] = await Promise.all([fs.lstat(a), fs.lstat(b)]);
	return statA.ino === statB.ino && statA.dev === statB.dev;
}

/**
 * Computes the renames for the selected files and folders (recursively)
 * without touching the disk. Renames that would overwrite another file are skipped.
 */
export async function planRenames(selection: string[]): Promise<Plan> {
	const files = new Set<string>();
	let includesDirectory = false;

	for (const selected of selection) {
		const stat = await fs.lstat(selected);
		if (stat.isDirectory()) {
			includesDirectory = true;
			const found: string[] = [];
			await collectFiles(selected, found);
			found.forEach((file) => files.add(file));
		} else if (stat.isFile()) {
			files.add(selected);
		}
	}

	const renames: Rename[] = [];
	const skipped: Skipped[] = [];
	const targets = new Set<string>();

	for (const from of [...files].sort()) {
		const cleaned = cleanFileName(path.basename(from));
		if (cleaned === undefined || cleaned === path.basename(from)) {
			continue;
		}
		const to = path.join(path.dirname(from), cleaned);
		if (targets.has(to)) {
			skipped.push({ path: from, reason: 'two files would get the same name' });
			continue;
		}
		const exists = await fs.lstat(to).then(() => true, () => false);
		if (exists && !(await isSameFile(from, to))) {
			skipped.push({ path: from, reason: `${cleaned} already exists` });
			continue;
		}
		targets.add(to);
		renames.push({ from, to });
	}

	return { renames, skipped, includesDirectory };
}

export async function applyRenames(renames: Rename[]): Promise<Skipped[]> {
	const failed: Skipped[] = [];
	for (const { from, to } of renames) {
		try {
			await fs.rename(from, to);
		} catch (error) {
			failed.push({ path: from, reason: error instanceof Error ? error.message : String(error) });
		}
	}
	return failed;
}
