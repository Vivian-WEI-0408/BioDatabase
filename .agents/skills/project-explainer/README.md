# Project Explainer

Project Explainer is an Agent Skill that turns an unfamiliar repository into clear, GitHub-ready documentation.

Use it when you want an AI coding agent to explain a project from top to bottom: what the project does, what stack it uses, how to run it, what users see, how folders and files fit together, and where a developer should make changes.

## What It Produces

The skill guides an agent to create documentation such as:

- A high-level project summary
- A tech stack breakdown with evidence from the repo
- Local install, run, test, build, and deployment instructions
- A folder-by-folder tour
- A file-by-file tour for meaningful source-authored files
- A description of what users see when the app runs
- Runtime, routing, API, state, or data-flow notes
- Known assumptions and unknowns instead of made-up claims

## Why This Skill Exists

Most project explanations are either too shallow or too noisy. This skill pushes the agent to read the actual repository first, separate facts from inferences, skip generated clutter, and write documentation that helps a new developer become productive quickly.

It is especially useful before publishing a project to GitHub, handing off a codebase, onboarding contributors, or generating a stronger README.

## Repository Contents

```text
project-explainer/
+-- bin/
|   +-- install.js
+-- SKILL.md
+-- README.md
+-- LICENSE
+-- package.json
+-- agents/
|   +-- openai.yaml
+-- references/
    +-- report-template.md
```

| Path | Purpose |
| --- | --- |
| `SKILL.md` | Main skill file. Agents read the frontmatter for discovery and load the instructions when relevant. |
| `references/report-template.md` | Optional Markdown skeleton for the project explanation report. |
| `agents/openai.yaml` | Optional Codex UI metadata for display name, short description, and default prompt. |
| `bin/install.js` | npm-powered installer that copies the skill into Codex and/or Claude skill directories. |
| `package.json` | npm package metadata and CLI entrypoints. |
| `README.md` | Human-facing GitHub documentation for installing and using the skill. |

## Quick Install With npm

After this package is published to npm:

```bash
npx project-explainer-skill install all
```

Install only for Codex:

```bash
npx project-explainer-skill install codex
```

Install only for Claude:

```bash
npx project-explainer-skill install claude
```

By default, the installer uses user-level skill directories:

```text
Codex:  ~/.agents/skills/project-explainer
Claude: ~/.claude/skills/project-explainer
```

To install into the current project instead:

```bash
npx project-explainer-skill install all --scope project
```

To install into a specific project directory:

```bash
npx project-explainer-skill install codex --scope project --cwd /path/to/repo
```

If `project-explainer-skill` is already taken on npm, rename the package in `package.json` before publishing and replace the command above with your package name.

## Install From A Local Clone

If you cloned this repository and want to install before publishing to npm:

```bash
node bin/install.js install all
```

Or install only one agent:

```bash
node bin/install.js install codex
node bin/install.js install claude
```

## Install In Codex

Codex supports Agent Skills in the CLI, IDE extension, and Codex app. Current Codex documentation says skills can be installed at repository, user, admin, or system scope.

### npm Install

```bash
npx project-explainer-skill install codex
```

For one repository only:

```bash
npx project-explainer-skill install codex --scope project
```

Then start Codex and ask:

```text
Use $project-explainer to create a GitHub-ready project guide for this repo.
```

### Manual Project Install

Copy this folder into the repository where you want the skill available:

```bash
mkdir -p .agents/skills
cp -R project-explainer .agents/skills/project-explainer
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .agents\skills
Copy-Item -Recurse project-explainer .agents\skills\project-explainer
```

Then start Codex from that repository and ask:

```text
Use $project-explainer to create a GitHub-ready project guide for this repo.
```

### Manual User Install

Use this when you want the skill available across projects:

```bash
mkdir -p ~/.agents/skills
cp -R project-explainer ~/.agents/skills/project-explainer
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills"
Copy-Item -Recurse project-explainer "$HOME\.agents\skills\project-explainer"
```

If Codex is already running and the skill does not appear, restart Codex.

## Install In Claude Code

Claude Code supports personal and project skills.

### npm Install

```bash
npx project-explainer-skill install claude
```

For one repository only:

```bash
npx project-explainer-skill install claude --scope project
```

Then run Claude Code and invoke:

```text
/project-explainer
```

or ask naturally:

```text
Explain this whole repository and create a GitHub-ready README.
```

### Manual Personal Install

```bash
mkdir -p ~/.claude/skills
cp -R project-explainer ~/.claude/skills/project-explainer
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item -Recurse project-explainer "$HOME\.claude\skills\project-explainer"
```

Then run Claude Code and invoke:

```text
/project-explainer
```

or ask naturally:

```text
Explain this whole repository and create a GitHub-ready README.
```

### Manual Project Install

Copy the folder into a project:

```bash
mkdir -p .claude/skills
cp -R project-explainer .claude/skills/project-explainer
```

Claude Code watches existing skill directories for changes. If you create the top-level skills directory after Claude Code has already started, restart Claude Code.

## Install In Claude.ai

Claude.ai custom skills are uploaded as ZIP files. npm can install the local Claude Code skill folder, but Claude.ai still expects an uploaded ZIP through the web UI.

1. Make sure the ZIP contains the `project-explainer/` folder at the root.
2. Go to Claude.ai.
3. Open `Customize > Skills`.
4. Click the add button, choose to create or upload a skill, and upload the ZIP.
5. Toggle the skill on.
6. Test it with a prompt such as:

```text
Use Project Explainer to document this uploaded repository for GitHub.
```

Claude skills require code execution to be enabled. Review any skill before enabling it, especially if it includes scripts or dependencies. This skill is instruction-only plus a Markdown reference template.

## Install In Other Agent Skill Systems

This skill follows the open Agent Skills pattern:

```text
skill-name/
+-- SKILL.md
+-- references/
```

For any agent that supports Agent Skills:

1. Find that agent's project-level or user-level skills directory.
2. Copy the full `project-explainer/` folder into that directory.
3. Restart or reload the agent if it does not detect new skills live.
4. Invoke the skill by name or ask for a repository explanation naturally.

If an agent does not support skills yet, you can still use the skill manually by pasting `SKILL.md` into the agent as instructions and attaching `references/report-template.md` when you want a report skeleton.

## Example Prompts

```text
Use $project-explainer to explain this entire repository and create PROJECT_GUIDE.md.
```

```text
Use Project Explainer to write a README that explains the stack, folder structure, every important file, how to run the app, and what users see.
```

```text
Use project-explainer to audit the docs in this repo and replace vague sections with accurate setup and architecture details.
```

## Safety Notes

- Do not include secrets in generated documentation.
- Treat environment variables as names and purposes only, not values.
- Review generated docs before publishing.
- If the agent runs tests or builds, check failures before copying commands into public docs.
- Keep the skill focused. Add separate skills for other workflows instead of turning this into a general documentation mega-skill.

## Updating The Skill

Edit `SKILL.md` when you want to change the agent workflow. Edit `references/report-template.md` when you want to change the default report shape.

After changes, validate the frontmatter:

```bash
python /path/to/quick_validate.py /path/to/project-explainer
```

At minimum, confirm that `SKILL.md` starts with YAML frontmatter containing `name` and `description`.

## Publish To npm

1. Create an npm account and log in:

```bash
npm login
```

2. Check the package contents:

```bash
npm pack --dry-run
```

3. Publish:

```bash
npm publish --access public
```

4. Test the published installer:

```bash
npx project-explainer-skill install all
```

If you publish under a scope, use a scoped name such as `@your-scope/project-explainer-skill` in `package.json` and install with:

```bash
npx @your-scope/project-explainer-skill install all
```

## Sources

This README is based on the open Agent Skills format plus current Codex and Claude skill installation behavior:

- OpenAI Codex manual: https://developers.openai.com/codex/skills
- Claude Code docs: https://code.claude.com/docs/en/skills
- Claude Help Center, Use Skills in Claude: https://support.claude.com/en/articles/12512180-use-skills-in-claude
- Claude Help Center, How to create custom skills: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Agent Skills open standard: https://agentskills.io

## License

Choose a license before publishing if you want others to reuse the skill. MIT or Apache-2.0 are common choices for small reusable developer tools.
