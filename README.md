# OpenUPM Data Repository

This repository now contains only OpenUPM curated data and the validator assets used to verify it.

## Contents

- `data/`: package and metadata YAML files
- `scripts/data-validator.js`: shared validation helpers
- `test/data-packages.js`: data validation test suite

## Validate data

```bash
npm install
npm test
```

or run only the validation target:

```bash
npm run test:data
```

## Production data deploy

Pushes to `master` run data validation in GitHub Actions. After validation
passes, CI triggers the `openupm/openupm-next` website workflow and updates the
production data checkout through a restricted SSH deploy hook.

The server-side hook and production deployment path are managed outside this
public data repository.
