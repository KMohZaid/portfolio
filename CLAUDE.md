# Project instructions

- Read `PERSONAL_CLAUDE.md` when present for private, user-specific environment and deployment instructions. Keep that file local and untracked; do not add personal hostnames, network targets, usernames, filesystem paths, domains, or credentials to this tracked file.
- This machine is for editing code only. Never run builds, tests, linters, package-manager commands, database migrations, or app deployment commands here.
- Run project verification and authorized test deployments only on the test/build environment described in `PERSONAL_CLAUDE.md`. Never access or deploy to the main production environment.
- Preserve the test app's configured port; do not change it to another port.
- Smoke-test only the authorized test URL described in `PERSONAL_CLAUDE.md`. Do not apply production database changes or migrate production data.
- Commit code changes on the requested feature branch and include the required `Co-Authored-By: Claude Code <noreply@anthropic.com>` trailer.
- Do not copy secrets into tracked files, print secrets, or change environment files without explicit need and care.
