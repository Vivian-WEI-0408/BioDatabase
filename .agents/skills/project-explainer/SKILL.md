---
name: project-explainer
description: Analyze and explain an entire software project or repository in clear GitHub-ready documentation. Use when the user asks for a codebase tour, project explanation, repository map, folder-by-folder or file-by-file breakdown, stack detection, setup/run instructions, what users see when the app runs, README expansion, onboarding docs, architecture summary, or a polished guide to put in GitHub.
---

# Project Explainer

## Purpose

Create accurate, useful, GitHub-ready documentation that helps a new developer understand what a project is, how it is built, how to run it, what each folder and source-authored file does, and what the end user experiences.

Prefer evidence from the repository over assumptions. If something cannot be verified, mark it as an inference or an unknown.

## Workflow

1. Inventory the repository.
   - Use `rg --files` first.
   - Identify source files, config files, package manifests, lockfiles, build outputs, generated files, tests, docs, public assets, environment examples, CI files, and deployment files.
   - Exclude or summarize dependency/vendor/build/cache folders such as `node_modules`, `.git`, `dist`, `build`, `.next`, `.turbo`, `coverage`, `__pycache__`, and generated lock artifacts unless they are directly relevant.

2. Detect the stack.
   - Read manifests and config files before describing technologies: `package.json`, lockfiles, framework configs, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `Dockerfile`, compose files, CI configs, deploy configs, and database/schema files.
   - Capture language, framework, runtime, package manager, styling approach, test framework, build tools, database, auth, external APIs, deployment target, and notable libraries.
   - Distinguish confirmed facts from likely inferences.

3. Understand execution.
   - Read scripts, entrypoints, server files, app routers, CLI files, Docker setup, and environment examples.
   - Explain install, development, test, build, and production commands.
   - Include required environment variables when visible, but never invent secrets or expose real secret values.
   - If the project can be run safely and the user asked for practical docs, run the lowest-risk verification command available, such as package script listing, tests, build, or dev server inspection.

4. Trace the product behavior.
   - For frontend apps, inspect routes/pages/components/state/data flow and explain what the user sees on first load and in major interactions.
   - For APIs, explain endpoints, request/response shapes when discoverable, auth requirements, and data flow.
   - For CLIs, explain commands, arguments, inputs, outputs, and side effects.
   - For libraries, explain public exports, intended consumers, and example usage.

5. Explain structure at two levels.
   - Folder map: explain every meaningful top-level folder and important nested folders.
   - File catalog: explain every source-authored file that matters to understanding, running, testing, or deploying the project.
   - Group repetitive, generated, image/font, or fixture files when a per-file explanation adds noise. State the grouping rule.

6. Produce a polished document.
   - Start with a short high-level summary.
   - Then provide quick start instructions.
   - Then explain stack, architecture, folders, files, runtime behavior, user experience, tests, deployment, and maintenance notes.
   - Use headings, concise prose, and tables where they improve scanning.
   - Write for a developer landing on the GitHub repo for the first time.
   - Avoid hype, vague claims, and restating filenames without explaining their purpose.

## Output Shape

When the user asks for a GitHub-ready artifact, create a Markdown file such as `PROJECT_GUIDE.md`, `REPOSITORY_TOUR.md`, or an improved `README.md`, depending on the request and repo conventions.

Use this default section order unless the project needs a better one:

1. Project summary
2. What the project does
3. What users see or can do
4. Tech stack
5. How the app is structured
6. Folder-by-folder tour
7. File-by-file tour
8. How to run locally
9. Available scripts or commands
10. Environment variables and configuration
11. Data flow, API flow, or state flow
12. Testing and quality checks
13. Build and deployment
14. Extension points and maintenance notes
15. Known unknowns or assumptions

For a reusable report skeleton, read `references/report-template.md`.

## Quality Bar

- Be specific: name concrete files, scripts, routes, modules, and commands.
- Be honest: label unknowns instead of filling gaps with generic guesses.
- Be complete but not mechanical: cover every meaningful file without wasting space on generated assets.
- Be beginner-friendly without being shallow: define project-specific relationships and responsibilities.
- Keep setup instructions executable: commands should be copyable and ordered.
- Preserve user changes: do not overwrite existing docs unless the user explicitly asks for replacement.
- If editing docs in a repository, match the repo's existing tone and formatting.

## Useful Reconnaissance Commands

Use commands appropriate to the environment:

```bash
rg --files
git status --short
git ls-files
```

For JavaScript or TypeScript projects:

```bash
npm run
npm test
npm run build
```

For Python projects:

```bash
python -m pytest
python -m pip show -f <package>
```

Run commands only when they are safe and useful for the user's goal. If a command fails, include the failure and what it implies.
