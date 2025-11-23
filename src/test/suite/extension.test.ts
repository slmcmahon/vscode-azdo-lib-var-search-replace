import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('slmcmahon.azdo-libvar-search-replace'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('slmcmahon.azdo-libvar-search-replace');
		assert.ok(extension);
		await extension.activate();
		assert.strictEqual(extension.isActive, true);
	});

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('azdo-libvar-search-replace.searchAndReplace'));
		assert.ok(commands.includes('azdo-libvar-search-replace.configureCredentials'));
		assert.ok(commands.includes('azdo-libvar-search-replace.clearCredentials'));
	});

	test('Configuration properties should be available', () => {
		const config = vscode.workspace.getConfiguration('azdo-libvar-search-replace');
		assert.ok(config.has('org'));
		assert.ok(config.has('project'));
		assert.ok(config.has('cacheTimeout'));
	});
});

suite('Token Replacement Tests', () => {
	test('Should match token pattern', () => {
		const pattern = /#\{(.*?)\}#/g;
		const text = 'Hello #{name}#, your age is #{age}#';
		const matches = text.match(pattern);
		
		assert.ok(matches);
		assert.strictEqual(matches.length, 2);
		assert.strictEqual(matches[0], '#{name}#');
		assert.strictEqual(matches[1], '#{age}#');
	});

	test('Should extract token keys correctly', () => {
		const pattern = /#\{(.*?)\}#/g;
		const text = 'Hello #{name}#, your age is #{age}#';
		const keys: string[] = [];
		
		let match;
		while ((match = pattern.exec(text)) !== null) {
			keys.push(match[1]);
		}
		
		assert.strictEqual(keys.length, 2);
		assert.strictEqual(keys[0], 'name');
		assert.strictEqual(keys[1], 'age');
	});

	test('Should handle text with no tokens', () => {
		const pattern = /#\{(.*?)\}#/g;
		const text = 'Hello world, no tokens here';
		const matches = text.match(pattern);
		
		assert.strictEqual(matches, null);
	});

	test('Should handle nested braces', () => {
		const pattern = /#\{(.*?)\}#/g;
		const text = '#{outer}# and #{in{ne}r}#';
		const keys: string[] = [];
		
		let match;
		while ((match = pattern.exec(text)) !== null) {
			keys.push(match[1]);
		}
		
		// Non-greedy match should capture until first closing brace
		assert.ok(keys.length > 0);
	});
});

