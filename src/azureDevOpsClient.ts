import { ApiError, AzureDevOpsConfig, VariableLibrary } from './types';

interface AzureDevOpsApiResponse {
	value: VariableLibrary[];
	count: number;
}

export class AzureDevOpsClient {
	private cache: Map<string, { data: VariableLibrary[]; timestamp: number }> = new Map();
	private cacheTimeout: number;

	constructor(cacheTimeout: number = 300000) {
		this.cacheTimeout = cacheTimeout;
	}

	/**
	 * Fetch variable libraries from Azure DevOps
	 */
	async getVariableLibraries(config: AzureDevOpsConfig): Promise<VariableLibrary[]> {
		const cacheKey = `${config.organization}/${config.project}`;
		const cached = this.cache.get(cacheKey);

		// Return cached data if still valid
		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data;
		}

		const url = `https://dev.azure.com/${config.organization}/${config.project}/_apis/distributedtask/variablegroups?api-version=7.0`;
		const token = Buffer.from(`nobody:${config.pat}`, 'utf8').toString('base64');

		try {
			const response = await fetch(url, {
				headers: {
					'Authorization': `Basic ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				
				if (response.status === 401) {
					throw new ApiError('Authentication failed. Please check your Personal Access Token.', 401);
				} else if (response.status === 404) {
					throw new ApiError('Organization or project not found. Please check your configuration.', 404);
				} else if (response.status === 403) {
					throw new ApiError('Access denied. Ensure your PAT has "Variable Groups (Read)" permissions.', 403);
				}
				
				throw new ApiError(
					`Failed to fetch variable libraries: ${response.status} ${response.statusText}. ${errorText}`,
					response.status
				);
			}

			const data = await response.json() as AzureDevOpsApiResponse;

			if (!data.value || !Array.isArray(data.value)) {
				throw new ApiError('Invalid response format from Azure DevOps API');
			}

			// Update cache
			this.cache.set(cacheKey, {
				data: data.value,
				timestamp: Date.now(),
			});

			return data.value;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}

			if (error instanceof TypeError && error.message.includes('fetch')) {
				throw new ApiError('Network error: Unable to connect to Azure DevOps. Please check your internet connection.');
			}

			throw new ApiError(
				`Unexpected error while fetching variable libraries: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Clear the cache
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Clear cache for a specific organization/project
	 */
	clearCacheForProject(organization: string, project: string): void {
		const cacheKey = `${organization}/${project}`;
		this.cache.delete(cacheKey);
	}
}
