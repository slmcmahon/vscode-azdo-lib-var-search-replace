import * as vscode from 'vscode';
import { AzureDevOpsConfig, ConfigurationError } from './types';

const SECRET_KEY = 'azdo-libvar-search-replace.pat';

export class ConfigurationManager {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Try to obtain an Azure AD access token via VS Code's authentication providers.
	 * Returns the access token string or null if not available.
	 */
	async getAADToken(): Promise<string | null> {
		try {
			// Try common provider ids that may be registered in the host
			const providerCandidates = ['microsoft', 'azure'];
			const scopes = ['499b84ac-1321-427f-aa17-267ca6975798/.default'];

			for (const providerId of providerCandidates) {
				try {
					const session = await vscode.authentication.getSession(providerId, scopes, { createIfNone: true });
					if (session && session.accessToken) {
						return session.accessToken;
					}
				} catch {
					// ignore and try next provider id
				}
			}
		} catch {
			// no-op
		}
		return null;
	}

	/**
	 * Return an authentication token object: prefer AAD token, fall back to stored PAT.
	 * If neither is available, prompts the user to sign in or configure a PAT.
	 */
	async getAuthTokenOrPAT(): Promise<{ type: 'aad' | 'pat'; token: string } | null> {
		// Try AAD first
		const aad = await this.getAADToken();
		if (aad) {
			return { type: 'aad', token: aad };
		}

		// Fall back to stored PAT
		const pat = await this.context.secrets.get(SECRET_KEY);
		if (pat) {
			return { type: 'pat', token: pat };
		}

		// Ask user which authentication method they want to use
		const choice = await vscode.window.showWarningMessage(
			'No Azure authentication is available. Sign in with Azure or configure a Personal Access Token?',
			'Sign in',
			'Use PAT',
			'Cancel'
		);

		if (choice === 'Sign in') {
			const newAad = await this.getAADToken();
			if (newAad) {
				return { type: 'aad', token: newAad };
			}
			vscode.window.showErrorMessage('Sign-in failed or was cancelled.');
			return null;
		} else if (choice === 'Use PAT') {
			const configured = await this.promptForConfiguration();
			if (!configured) {
				return null;
			}
			const newPat = await this.context.secrets.get(SECRET_KEY);
			if (newPat) {
				return { type: 'pat', token: newPat };
			}
			return null;
		}

		return null;
	}

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

		// Prompt for PAT (optional). Users can leave this blank to rely on
		// Azure AD sign-in instead — PATs are only needed if you prefer or
		// cannot use Azure authentication.
		const patInput = await vscode.window.showInputBox({
			prompt: 'Enter your Azure DevOps Personal Access Token (optional). Leave blank to use Azure sign-in instead',
			placeHolder: 'Paste your PAT here (optional)',
			password: true,
			ignoreFocusOut: true,
			// Allow empty input so the user can skip storing a PAT.
			validateInput: () => null,
		});

		// If the input box was cancelled, abort configuration.
		if (patInput === undefined) {
			return false;
		}

		const trimmedPat = patInput.trim();
		if (trimmedPat) {
			await this.storePAT(trimmedPat);
			vscode.window.showInformationMessage('Azure DevOps credentials configured successfully!');
		} else {
			// User opted to skip entering a PAT. Inform them that AAD sign-in
			// will be used when available.
			vscode.window.showInformationMessage(
				'Azure DevOps configured without a Personal Access Token. Use Azure sign-in when prompted to authenticate.'
			);
		}

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
