# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands
- Build: `npm run build`
- Run all tests: `npm run test`
- Type checking: `npx tsc --noEmit`

## Code Style Guidelines
- **Types**: Use explicit TypeScript types (no implicit any). Follow existing type naming patterns.
- **Formatting**: Maintain consistent indentation (2 spaces). Use concise, expressive code.
- **Imports**: Import specific modules rather than entire packages.
- **Naming**: Use camelCase for variables/functions, PascalCase for types/interfaces/enums.
- **Error handling**: Use typed errors with descriptive messages. Add parameter validation for public functions.
- **Comments**: Annotate complex algorithms with comments (especially math calculations).
- **Constants**: Use uppercase for constants with descriptive names.
- **Testing**: Maintain and update test cases for any algorithm changes.

Remember this is a minimalistic, zero-dependency implementation - keep it simple and follow the FSRS paper's algorithms.