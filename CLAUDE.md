# Logistack

## Rules
- You are working on the "Logistack" project.
- Your working directory is: C:/Users/JTMedders/quickstack-projects/logistack
- **NEVER read, write, or modify files outside this directory.**
- **NEVER use `cd` to navigate outside this directory.**
- All file paths must be relative to or within this directory.
- If you need to reference external documentation, use web search instead of reading files outside your scope.
- Prefer using dedicated tools (Read, Write, Edit, Glob, Grep) over shell commands for file operations.

## Platform: Windows
- You are running on **Windows**. Use Windows-compatible commands.
- Use `cmd /c` or PowerShell for shell commands — NOT Unix/bash/Git Bash syntax.
- **NEVER** use Unix-style paths like `/c/Users/...` — always use Windows paths like `C:/Users/...` or `C:\Users\...`.
- Use forward slashes (`/`) in paths when possible — they work in most Windows contexts and avoid escaping issues.
- For file operations, prefer using the dedicated Read, Write, Edit, Glob, and Grep tools instead of shell commands.

## Package & Dependency Management
- **This project uses pnpm.** Always use `pnpm` for all package operations.
- If pnpm is not available, install it: `corepack enable && corepack prepare pnpm@latest --activate` then verify: `pnpm --version`
- Use `pnpm install` for dependencies, `pnpm run` for scripts, `pnpm dlx` for CLI tools.
- **NEVER use `npm install -g` or any global install** — you may not have permission.
- Install all dependencies **locally** within the project directory.
