import * as vscode from 'vscode';
import { AzureDevOpsClient } from './azureDevOpsClient';
import { ConfigurationManager } from './configurationManager';
import { ApiError, ConfigurationError, QuickPickOption, ReplacementMap, VariableLibrary } from './types';

let azureDevOpsClient: AzureDevOpsClient;
let configManager: ConfigurationManager;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
	outputChannel = vscode.window.createOutputChannel('Azure DevOps Variable Library');
	context.subscriptions.push(outputChannel);

	outputChannel.appendLine('Azure DevOps Variable Library Search and Replace extension activated');

	// Initialize services
	configManager = new ConfigurationManager(context);
	azureDevOpsClient = new AzureDevOpsClient(configManager.getCacheTimeout());

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'azdo-libvar-search-replace.searchAndReplace',
			handleSearchAndReplace
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'azdo-libvar-search-replace.configureCredentials',
			handleConfigureCredentials
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'azdo-libvar-search-replace.clearCredentials',
			handleClearCredentials
		)
	);

	// Listen for configuration changes to clear cache
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('azdo-libvar-search-replace')) {
				azureDevOpsClient.clearCache();
				outputChannel.appendLine('Configuration changed - cache cleared');
			}
		})
	);
}

export function deactivate(): void {
	outputChannel.appendLine('Azure DevOps Variable Library Search and Replace extension deactivated');
}

/**
 * Handle the search and replace command
 */
async function handleSearchAndReplace(): Promise<void> {
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active text editor found. Please open a file first.');
			return;
		}

		// Check if configured
		const isConfigured = await configManager.isConfigured();
		if (!isConfigured) {
			const configure = await vscode.window.showWarningMessage(
				'Azure DevOps credentials are not configured.',
				'Configure Now',
				'Cancel'
			);

			if (configure === 'Configure Now') {
				const configured = await configManager.promptForConfiguration();
				if (!configured) {
					return;
				}
			} else {
				return;
			}
		}

		// Get configuration
		const config = await configManager.getConfig();
		outputChannel.appendLine(`Fetching variable libraries for ${config.organization}/${config.project}`);

		// Fetch variable libraries with progress indicator
		const variableLibraries = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Fetching Azure DevOps Variable Libraries',
				cancellable: false,
			},
			async (progress) => {
				progress.report({ message: 'Loading...' });
				return await azureDevOpsClient.getVariableLibraries(config);
			}
		);

		if (!variableLibraries || variableLibraries.length === 0) {
			vscode.window.showInformationMessage(
				'No variable libraries found in the configured project.'
			);
			outputChannel.appendLine('No variable libraries found');
			return;
		}

		outputChannel.appendLine(`Found ${variableLibraries.length} variable libraries`);

		// Create quick pick options
		const quickPickOptions: QuickPickOption[] = variableLibraries.map((lib) => ({
			id: String(lib.id),
			label: lib.name,
			description: `${Object.keys(lib.variables).length} variables`,
		}));

		// Show quick pick
		const selectedItem = await vscode.window.showQuickPick(quickPickOptions, {
			placeHolder: 'Select a variable library to use for replacement',
			matchOnDescription: true,
		});

		if (!selectedItem) {
			outputChannel.appendLine('No variable library selected');
			return;
		}

		// Find the selected library
		const selectedLibrary = variableLibraries.find(
			(lib) => lib.id === Number(selectedItem.id)
		);

		if (!selectedLibrary) {
			vscode.window.showErrorMessage('Selected variable library not found.');
			return;
		}

		outputChannel.appendLine(`Selected library: ${selectedLibrary.name}`);

		// Perform replacement
		await performReplacement(editor, selectedLibrary);

	} catch (error) {
		handleError(error);
	}
}

/**
 * Perform the actual text replacement
 */
async function performReplacement(
	editor: vscode.TextEditor,
	library: VariableLibrary
): Promise<void> {
	const docText = editor.document.getText();

	// Build replacement map
	const replacements: ReplacementMap = {};
	for (const key in library.variables) {
		replacements[key] = library.variables[key].value;
	}

	// Track replacements for logging
	const replacedKeys = new Set<string>();
	const missingKeys = new Set<string>();

	// Perform replacement using regex
	const result = docText.replace(
		/#\{(.*?)\}#/g,
		(match, key: string) => {
			if (key in replacements) {
				replacedKeys.add(key);
				return replacements[key];
			} else {
				missingKeys.add(key);
				return match;
			}
		}
	);

	// Check if any replacements were made
	if (replacedKeys.size === 0 && missingKeys.size === 0) {
		vscode.window.showInformationMessage(
			'No tokens found in the document matching the pattern #{...}#'
		);
		return;
	}

	// Apply the replacement
	const fullRange = new vscode.Range(
		editor.document.positionAt(0),
		editor.document.positionAt(docText.length)
	);

	await editor.edit((editBuilder) => {
		editBuilder.replace(fullRange, result);
	});

	// Log results
	outputChannel.appendLine(`Replaced ${replacedKeys.size} variables`);
	if (replacedKeys.size > 0) {
		outputChannel.appendLine(`Replaced keys: ${Array.from(replacedKeys).join(', ')}`);
	}
	if (missingKeys.size > 0) {
		outputChannel.appendLine(`Missing keys: ${Array.from(missingKeys).join(', ')}`);
	}

	// Show success message
	let message = `Replaced ${replacedKeys.size} variable${replacedKeys.size !== 1 ? 's' : ''}`;
	if (missingKeys.size > 0) {
		message += ` (${missingKeys.size} token${missingKeys.size !== 1 ? 's' : ''} not found in library)`;
	}

	vscode.window.showInformationMessage(message);

	// Show warning if there are missing keys
	if (missingKeys.size > 0) {
		const showDetails = await vscode.window.showWarningMessage(
			`Some tokens were not found in the variable library: ${Array.from(missingKeys).join(', ')}`,
			'Show Output'
		);

		if (showDetails === 'Show Output') {
			outputChannel.show();
		}
	}
}

/**
 * Handle the configure credentials command
 */
async function handleConfigureCredentials(): Promise<void> {
	try {
		await configManager.promptForConfiguration();
	} catch (error) {
		handleError(error);
	}
}

/**
 * Handle the clear credentials command
 */
async function handleClearCredentials(): Promise<void> {
	try {
		const confirm = await vscode.window.showWarningMessage(
			'Are you sure you want to clear your Azure DevOps credentials?',
			{ modal: true },
			'Yes',
			'No'
		);

		if (confirm === 'Yes') {
			await configManager.deletePAT();
			azureDevOpsClient.clearCache();
			vscode.window.showInformationMessage('Azure DevOps credentials cleared successfully.');
			outputChannel.appendLine('Credentials cleared');
		}
	} catch (error) {
		handleError(error);
	}
}

/**
 * Centralized error handler
 */
function handleError(error: unknown): void {
	let message: string;

	if (error instanceof ConfigurationError) {
		message = error.message;
		vscode.window.showWarningMessage(message);
	} else if (error instanceof ApiError) {
		message = error.message;
		vscode.window.showErrorMessage(message);
		outputChannel.appendLine(`API Error: ${message}`);
		if (error.statusCode) {
			outputChannel.appendLine(`Status Code: ${error.statusCode}`);
		}
	} else if (error instanceof Error) {
		message = `Unexpected error: ${error.message}`;
		vscode.window.showErrorMessage(message);
		outputChannel.appendLine(`Error: ${error.message}`);
		if (error.stack) {
			outputChannel.appendLine(error.stack);
		}
	} else {
		message = 'An unknown error occurred';
		vscode.window.showErrorMessage(message);
		outputChannel.appendLine(`Unknown error: ${String(error)}`);
	}

	outputChannel.show();
}

