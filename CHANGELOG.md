# Change Log

All notable changes to the "azdo-libvar-search-replace" extension will be documented in this file.

## [0.1.0] - 2025-11-23

### Added
- Secure credential storage using VS Code's SecretStorage API
- New commands: "Configure Azure DevOps Credentials" and "Clear Azure DevOps Credentials"
- Smart caching of variable libraries with configurable timeout
- Progress indicators during API operations
- Output channel for detailed logging and debugging
- Comprehensive error handling with user-friendly messages
- Configuration validation before executing commands
- Support for showing missing/replaced token statistics
- Cache invalidation on configuration changes

### Changed
- **BREAKING**: Personal Access Tokens are now stored securely in SecretStorage instead of settings
- Migrated from axios to native fetch API (Node.js 18+)
- Updated to latest VS Code engine (1.95.0)
- Modernized TypeScript configuration with stricter type checking
- Refactored code into separate modules (types, API client, configuration manager)
- Improved error messages with actionable guidance
- Enhanced token replacement with detailed feedback

### Improved
- Better TypeScript types with no non-null assertions
- Separated concerns: API logic, configuration, and UI
- Added proper async/await error boundaries
- More comprehensive tests replacing placeholder tests

### Removed
- Removed axios dependency in favor of native fetch
- Removed PAT from workspace/user settings (now in SecretStorage)

### Fixed
- Added missing error handling throughout the extension
- Improved validation of API responses
- Better handling of network errors

## [0.0.2] - 2025-11-23

- Initial release