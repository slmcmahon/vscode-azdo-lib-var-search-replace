# Migration Guide - Version 0.0.3

This guide helps you migrate from version 0.0.2 to the modernized version of the Azure DevOps Variable Library Search and Replace extension.

## Breaking Changes

### Personal Access Token Storage

**Before (v0.0.2):**
- PAT was stored in VS Code settings (`azdo-libvar-search-replace.pat`)
- Visible in settings JSON files
- Not encrypted

**After (v0.0.3):**
- PAT is stored securely using VS Code's SecretStorage API
- Encrypted by VS Code
- Not visible in any settings files

### Migration Steps

1. **Note your current PAT** (if you remember it, or have it saved elsewhere)
   - Open VS Code settings
   - Find `azdo-libvar-search-replace.pat`
   - Copy the value

2. **Update the extension**
   - Install the new version

3. **Remove old PAT from settings**
   - Open VS Code settings (JSON)
   - Remove the line: `"azdo-libvar-search-replace.pat": "your-token-here"`
   
4. **Configure credentials**
   - Run command: `Azure DevOps: Configure Credentials`
   - Enter your organization (already configured)
   - Enter your project (already configured)
   - Enter your PAT (paste the value from step 1)

## New Features

### Commands

Three new commands are available:

1. **Search and Replace using Azure DevOps Variable Library** (existing, improved)
   - Enhanced with progress indicators
   - Better error messages
   - Detailed logging

2. **Configure Azure DevOps Credentials** (new)
   - Interactive setup wizard
   - Validates input
   - Stores PAT securely

3. **Clear Azure DevOps Credentials** (new)
   - Removes stored PAT
   - Clears cache
   - Prompts for confirmation

### Configuration

New setting added:

- `azdo-libvar-search-replace.cacheTimeout`: Cache duration in milliseconds (default: 300000 / 5 minutes)

Old setting removed:

- `azdo-libvar-search-replace.pat`: No longer used (use SecretStorage instead)

### Enhanced User Experience

1. **Progress Indicators**
   - Visual feedback when fetching variable libraries
   - No more wondering if the extension is working

2. **Output Channel**
   - View > Output > Select "Azure DevOps Variable Library"
   - See detailed logs of operations
   - Track which variables were replaced

3. **Better Error Messages**
   - Specific messages for common issues
   - Actionable suggestions for fixing problems
   - Links to configuration commands

4. **Smart Caching**
   - Variable libraries are cached for 5 minutes by default
   - Cache automatically clears when configuration changes
   - Reduces API calls and improves performance

5. **Replacement Statistics**
   - See how many variables were replaced
   - Get warnings about missing tokens
   - View details in the output channel

## Technical Improvements

For developers and those interested in what changed under the hood:

### Code Architecture

- **Modular Design**: Code split into separate files
  - `types.ts`: Type definitions and custom errors
  - `azureDevOpsClient.ts`: API communication
  - `configurationManager.ts`: Configuration and credential management
  - `extension.ts`: Main extension logic

### Modern TypeScript

- **Stricter Type Checking**: Enabled all recommended strict options
- **No Non-null Assertions**: Proper type guards instead of `!`
- **Better Error Handling**: Custom error types for different scenarios

### Native APIs

- **Replaced axios with fetch**: Using Node.js 18+ native fetch
- **No External Dependencies**: Zero runtime dependencies

### Testing

- **Real Tests**: Replaced placeholder tests with actual extension tests
- **Modern Test Runner**: Updated to `@vscode/test-cli`

## Troubleshooting

### "Personal Access Token is not configured"

Run the command: `Azure DevOps: Configure Credentials`

### "My old PAT setting isn't working"

The PAT must now be configured through the credential command, not in settings.

### "Authentication failed"

Your PAT may have expired. Generate a new one and run:
`Azure DevOps: Configure Credentials`

### "No variable libraries found"

Ensure:
1. Your organization and project names are correct (check settings)
2. Your PAT has "Variable Groups (Read)" permission
3. Your project actually has variable libraries

## Support

If you encounter issues:

1. Check the Output channel: View > Output > "Azure DevOps Variable Library"
2. Verify your configuration in VS Code settings
3. Try clearing and reconfiguring credentials
4. Report issues on GitHub: https://github.com/slmcmahon/vscode-azdo-lib-var-search-replace/issues
