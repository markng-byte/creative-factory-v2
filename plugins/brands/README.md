# Brand plugins

One folder per brand, `plugins/brands/<slug>/`:

- `brand.json` (required): a `BrandTokensBundle` (`brandTokens` + `designTokens`, see `@creative-factory/creative-ir-compiler` ports).
- `rules.json` (optional): brand QA rules such as copy limits.
- `README.md`: where the values come from and which ones are provisional.

`FileSystemBrandTokensSource` (in `@creative-factory/creative-ir-compiler`) reads every `brand.json` under this folder and serves it by `brandTokens.brandId`. Copy `_template` to start a new brand.
