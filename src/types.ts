export interface VariableLibrary {
	id: number;
	name: string;
	variables: {
		[key: string]: {
			value: string;
			isSecret: boolean;
			allowOverride: boolean;
		};
	};
}

export interface QuickPickOption {
	id: string;
	label: string;
	description?: string;
}

export interface AzureDevOpsConfig {
	organization: string;
	project: string;
	pat: string;
}

export interface ReplacementMap {
	[key: string]: string;
}

export class ConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigurationError';
	}
}

export class ApiError extends Error {
	constructor(message: string, public statusCode?: number) {
		super(message);
		this.name = 'ApiError';
	}
}
