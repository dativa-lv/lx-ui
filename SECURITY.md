# Security policy

Many applications rely on LX/UI, so a vulnerability in a shared component can affect people across several applications. Thanks for helping us keep LX/UI and the applications built with it secure.

## Report a vulnerability

Please **DO NOT** file a public issue. Instead, report the vulnerability privately by opening a [GitHub security advisory](https://github.com/dativa-lv/lx-ui/security/advisories/new).

Include the following details where possible:

- The LX/UI version or commit you tested.
- The affected component, utility, or plugin.
- Steps to reproduce the issue, including any relevant props or configuration. A small Vue example is especially helpful.
- What an attacker could do and under what conditions.

Use sample data and remove any credentials or personal information before submitting your report.

The LX/UI maintainers will review your report and follow up privately. If we confirm a vulnerability, we'll coordinate disclosure and provide guidance on affected versions, fixes, or workarounds.

## Dependency security

We use Dependabot and internal tools to monitor third-party dependencies for known vulnerabilities. We regularly update dependencies and review security findings as part of each weekly LX/UI release.