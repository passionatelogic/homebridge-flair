# Changelog

## [1.6.0] - 2025-10-11

### Changed
- Default OAuth flow now uses Flair client credentials, removing the need to configure account usernames and passwords.
- Added advanced grant configuration options (`grantType`, `realm`, `tokenEndpoints`) for edge cases.
- Updated polling logic to honour a sanitized default interval when `pollInterval` is omitted.

### Documentation
- Simplified configuration instructions to highlight the new defaults and added guidance for optional OAuth settings.

## [1.4.0] - 2025-08-13

### Fixed
- **CRITICAL**: Fixed `UnhandledPromiseRejection` error that caused Homebridge crashes when structure is not available
- Improved error handling in `getStructure()` method with proper Error objects instead of string throws
- Added try-catch blocks around accessory configuration to prevent crashes during restore
- Enhanced error logging with descriptive messages

### Changed
- **BREAKING**: Updated Node.js requirements to `^18.17.0 || ^20.9.0 || ^22.0.0` for Homebridge v2.0 compatibility
- **BREAKING**: Updated Homebridge requirements to `^1.8.0 || ^2.0.0-beta.0`
- Updated TypeScript target to ES2022
- Updated TypeScript to v5.0.0
- Updated @types/node to v20.0.0
- Improved error messages to be more user-friendly

### Security
- Fixed potential crash scenarios that could affect Homebridge stability
- Added graceful handling of missing Flair account structures

### Notes
This release addresses the critical stability issue where the plugin would crash Homebridge with "The structure is not available, this should not happen." error. The plugin now handles missing structures gracefully and provides clear error messages to help users diagnose configuration issues.