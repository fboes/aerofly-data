# Contributing custom airports

Thank you for helping improve the airport data for Aerofly FS4! This repository accepts community-provided custom airports via the `data/airports-custom.md` file. Follow the steps below to propose additions or changes.

## Quick steps

1. Fork this repository on GitHub using the "Fork" button in the top-right of the project page.
2. Clone your fork locally and create a feature branch:

   ```pwsh
   git clone https://github.com/<your-username>/aerofly-data.git
   cd aerofly-data
   git checkout -b add-airports-custom-<short-desc>
   ```

3. Edit `data/airports-custom.md` in your branch. Follow the existing format in that file - copy an existing entry as a template.

4. Commit and push your changes to your fork:

   ```pwsh
   git add data/airports-custom.md
   git commit -m "Add custom airports: <list of ICAOs or short description>"
   git push -u origin add-airports-custom-<short-desc>
   ```

5. Open a Pull Request (PR) from your branch to the upstream `fboes/aerofly-data` repository: provide a short description of the changes, and mention any sources or verification steps you used.

## Example entry

If you need a minimal example for layout, add entries similar to existing lines in `data/airports-custom.md`, for example:

```markdown
- KXYZ - Airport name
```

## After opening the PR

- Respond to reviewer feedback by pushing additional commits to the same branch.
- A maintainer will merge your PR once it has been reviewed and approved.

Thank you for contributing! Your additions help improve the Aerofly experience for everyone.
