# SARIF Azure DevOps Extension

An Azure DevOps extension encapsulating the [SARIF Web Component](https://github.com/Microsoft/sarif-web-component).

## Installation

As a DevOps end user, you will need to contact your organization owner to install this (and any) extension. Find your organization owner at `https://dev.azure.com/{yourorganization}/_settings/organizationOverview`.

As a DevOps organization owner, install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sariftools.sarif-viewer-build-tab).

## Publishing to Visual Studio Marketplace

As a developer on this project, here is the pre-publish checklist:
* Check the `vss-extension.json` `version` relative to the last published version at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sariftools.sarif-viewer-build-tab). The version may need to be manually incremented.
* If App Insights telemery is desired, remember to fill in your `instrumentationKey` in `index.tsx` (near the bottom).

Finally to publish, use:
```
npm install
npm run publish
```
You may be prompted for your personal access token. Verify deployment at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sariftools.sarif-viewer-build-tab) (check the version and release date).

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
