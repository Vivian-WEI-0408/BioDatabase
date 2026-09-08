# Project Explanation Report Template

Use this template when creating GitHub-ready project documentation. Adapt section names to the repository.

````markdown
# Project Name

## Project Summary

Short explanation of what the project is, who it is for, and the main outcome it provides.

## What Users See

Describe the first screen or primary interface. Cover the main flows, visible states, and important interactions.

## Tech Stack

| Area | Technology | Evidence |
| --- | --- | --- |
| Runtime |  |  |
| Framework |  |  |
| Styling |  |  |
| Testing |  |  |
| Build/deploy |  |  |

## How To Run Locally

```bash
# install dependencies

# start development

# run tests

# build for production
```

## Project Structure

```text
.
+-- folder/
+-- file
```

## Folder Tour

| Folder | Purpose |
| --- | --- |
| `src/` |  |

## File Tour

| File | Purpose |
| --- | --- |
| `package.json` |  |

## Architecture And Data Flow

Explain entrypoints, routing, state management, API calls, persistence, and boundaries between modules.

## Configuration

Document visible environment variables, config files, feature flags, ports, and external services. Do not include secret values.

## Scripts And Commands

| Command | What it does |
| --- | --- |
| `npm run dev` |  |

## Testing

Explain test tools, test locations, commands, and any observed test status.

## Build And Deployment

Explain production build output, hosting target, Docker/CI/deploy config, and release steps if visible.

## Extension Points

Explain where a developer would add routes, components, API endpoints, models, styles, tests, or config.

## Assumptions And Unknowns

List anything inferred or not discoverable from the repository.
````
