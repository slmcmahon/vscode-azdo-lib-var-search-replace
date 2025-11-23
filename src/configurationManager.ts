import * as vscode from 'vscode';
import { AzureDevOpsConfig, ConfigurationError } from './types';

const SECRET_KEY = 'azdo-libvar-search-replace.pat';

export class ConfigurationManager {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Get the complete Azure DevOps configuration
	 */
	async getConfig(): Promise<AzureDevOpsConfig> {
		const config = vscode.workspace.getConfiguration('azdo-libvar-search-replace');
		const organization = config.get<string>('org', '').trim();
		const project = config.get<string>('project', '').trim();
		const pat = await this.context.secrets.get(SECRET_KEY);

		if (!organization) {
			throw new ConfigurationError('Azure DevOps organization is not configured. Please set it in settings.');
		}

		if (!project) {
			throw new ConfigurationError('Azure DevOps project is not configured. Please set it in settings.');
		}

		if (!pat) {
			throw new ConfigurationError('Personal Access Token is not configured. Please run "Configure Azure DevOps Credentials" command.');
		}

		return {
			organization,
			project,
			pat,
		};
	}

	/**
	 * Validate that all required configuration is present
	 */
	async isConfigured(): Promise<boolean> {
		try {
			await this.getConfig();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get cache timeout from configuration
	 */
	getCacheTimeout(): number {
		const config = vscode.workspace.getConfiguration('azdo-libvar-search-replace');
		return config.get<number>('cacheTimeout', 300000);
	}

	/**
	 * Store the Personal Access Token securely
	 */
	async storePAT(pat: string): Promise<void> {
		await this.context.secrets.store(SECRET_KEY, pat);
	}

	/**
	 * Delete the Personal Access Token
	 */
	async deletePAT(): Promise<void> {
		await this.context.secrets.delete(SECRET_KEY);
	}

	/**
	 * Prompt user to configure credentials
	 */
	async promptForConfiguration(): Promise<boolean> {
		const config = vscode.workspace.getConfiguration('azdo-libvar-search-replace');
		let organization = config.get<string>('org', '').trim();
		let project = config.get<string>('project', '').trim();

		// Prompt for organization if not set
		if (!organization) {
			const orgInput = await vscode.window.showInputBox({
				prompt: 'Enter your Azure DevOps organization name',
				placeHolder: 'e.g., mycompany',
				ignoreFocusOut: true,
				validateInput: (value) => {
					return value.trim() ? null : 'Organization name is required';
				},
			});

			if (!orgInput) {
				return false;
			}

			organization = orgInput.trim();
			await config.update('org', organization, vscode.ConfigurationTarget.Global);
		}

		// Prompt for project if not set
		if (!project) {
			const projectInput = await vscode.window.showInputBox({
				prompt: 'Enter your Azure DevOps project name',
				placeHolder: 'e.g., MyProject',
				ignoreFocusOut: true,
				validateInput: (value) => {
					return value.trim() ? null : 'Project name is required';
				},
			});

			if (!projectInput) {
				return false;
			}

			project = projectInput.trim();
			await config.update('project', project, vscode.ConfigurationTarget.Global);
		}

		// Prompt for PAT
		const patInput = await vscode.window.showInputBox({
			prompt: 'Enter your Azure DevOps Personal Access Token',
			placeHolder: 'Paste your PAT here',
			password: true,
			ignoreFocusOut: true,
			validateInput: (value) => {
				return value.trim() ? null : 'Personal Access Token is required';
			},
		});

		if (!patInput) {
			return false;
		}

		await this.storePAT(patInput.trim());

		vscode.window.showInformationMessage(
			'Azure DevOps credentials configured successfully!'
		);

		return true;
	}

	/**
	 * Get organization and project for display purposes
	 */
	getOrgAndProject(): { organization: string; project: string } | null {
		const config = vscode.workspace.getConfiguration('azdo-libvar-search-replace');
		const organization = config.get<string>('org', '').trim();
		const project = config.get<string>('project', '').trim();

		if (!organization || !project) {
			return null;
		}

		return { organization, project };
	}
}
