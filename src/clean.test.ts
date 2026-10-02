import * as assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { applyRenames, cleanFileName, planRenames } from './clean';

test('cleanFileName removes accents, spaces and special characters', () => {
	assert.equal(cleanFileName('Café Crème (1).PDF'), 'Cafe-Creme-1.pdf');
	assert.equal(cleanFileName('Straße Œuvre.txt'), 'Strasse-OEuvre.txt');
	assert.equal(cleanFileName('--a   b__.md'), 'a-b.md');
	assert.equal(cleanFileName('archive.tar.GZ'), 'archive.tar.gz');
});

test('cleanFileName leaves hidden files and empty results alone', () => {
	assert.equal(cleanFileName('.gitignore'), undefined);
	assert.equal(cleanFileName('###.txt'), undefined);
});

test('planRenames is recursive, skips hidden folders and never overwrites', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'clean-filename-'));
	try {
		await fs.mkdir(path.join(root, 'sub dir'));
		await fs.mkdir(path.join(root, '.git'));
		await fs.mkdir(path.join(root, 'node_modules'));
		await fs.writeFile(path.join(root, 'é a.txt'), '');
		await fs.writeFile(path.join(root, 'sub dir', 'b c.txt'), '');
		await fs.writeFile(path.join(root, '.git', 'x y'), '');
		await fs.writeFile(path.join(root, 'node_modules', 'x y'), '');
		await fs.writeFile(path.join(root, 'a b.txt'), '');
		await fs.writeFile(path.join(root, 'a-b.txt'), '');

		const plan = await planRenames([root]);
		const names = plan.renames.map((r) => path.relative(root, r.to)).sort();
		assert.deepEqual(names, ['e-a.txt', path.join('sub dir', 'b-c.txt')]);
		assert.deepEqual(plan.skipped.map((s) => path.basename(s.path)), ['a b.txt']);
		assert.equal(plan.includesDirectory, true);

		assert.deepEqual(await applyRenames(plan.renames), []);
		assert.deepEqual((await fs.readdir(root)).sort(), ['.git', 'a b.txt', 'a-b.txt', 'e-a.txt', 'node_modules', 'sub dir']);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
