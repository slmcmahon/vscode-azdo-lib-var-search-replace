# Azure DevOps Variable Library Search & Replace

This extension allows you to quickly execute search and replace for tokens in a text file that match variables defined in an Azure DevOps Variable Library.

## Features

- **Secure Credential Storage**: Personal Access Tokens are stored securely using VS Code's SecretStorage API
- **Smart Caching**: Variable libraries are cached to reduce API calls and improve performance
- **Progress Indicators**: Visual feedback during API operations
- **Detailed Logging**: Output channel for debugging and tracking replacements
- **Configuration Validation**: Validates settings before executing commands
- **Error Handling**: Comprehensive error messages for common issues

## Requirements

You need access to an Azure DevOps Project. Authentication can happen in two ways:

1. **Azure Sign-In (Preferred)** – If you are already signed into Azure in VS Code (or can sign in when prompted), the extension will use your Azure Active Directory token—no Personal Access Token (PAT) required.
2. **Personal Access Token (Optional Fallback)** – If Azure sign-in is unavailable or you prefer a PAT, create one with at least read access to variable groups.

Minimum PAT permission:
- **Variable Groups (Read)**

## Getting Started

### Initial Setup

1. **Configure Credentials / Project Info**:
   - Run: `Azure DevOps: Configure Credentials` (or set individually via `Set Azure DevOps Organization` / `Set Azure DevOps Project`)
   - Enter your organization name (e.g., `mycompany`)
   - Enter your project name (e.g., `MyProject`)
   - When prompted for a Personal Access Token you may leave it blank to rely on Azure sign-in.

2. **Use the Extension**:
   - Open a file containing tokens in the format `#{variableName}#`
   - Run the command: `Search and Replace using Azure DevOps Variable Library`
   - Select the desired variable library from the list
   - Tokens in your file will be replaced with values from the library

### Commands

- `Azure DevOps: Search and Replace using Variable Library` – Replace tokens in the current file
- `Azure DevOps: Configure Credentials` – Set or update org/project (+ optional PAT)
- `Azure DevOps: Set Azure DevOps Organization` – Change just the organization
- `Azure DevOps: Set Azure DevOps Project` – Change just the project
- `Azure DevOps: Reset Azure DevOps Configuration` – Clear org, project, and stored PAT
- `Azure DevOps: Clear Credentials` – Remove only the stored credentials

## Extension Settings

This extension contributes the following settings:

- `azdo-libvar-search-replace.org`: The name of your Azure DevOps Organization
- `azdo-libvar-search-replace.project`: The name of your Azure DevOps project
- `azdo-libvar-search-replace.cacheTimeout`: Cache timeout for variable libraries in milliseconds (default: 300000 / 5 minutes)

**Note**: Personal Access Tokens are no longer stored in settings - they are stored securely using VS Code's SecretStorage API.

## Token Format

Tokens in your files should follow this format:
```
#{variableName}#
```

Example:
```
Database: #{DatabaseServer}#
API Key: #{ApiKey}#
```

## Security

- Personal Access Tokens are stored using VS Code's SecretStorage API (encrypted)
- PATs are never written to workspace or user settings
- Use the "Clear Credentials" command to remove stored tokens

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Verify your Personal Access Token is valid and not expired
- Ensure the PAT has "Variable Groups (Read)" permission

**"Organization or project not found"**
- Check the spelling of your organization and project names
- Organization and project names are case-sensitive

**"No variable libraries found"**
- Ensure your project has variable libraries
- Verify your PAT has access to the project

For detailed error information, check the Output panel (View > Output) and select "Azure DevOps Variable Library" from the dropdown.
