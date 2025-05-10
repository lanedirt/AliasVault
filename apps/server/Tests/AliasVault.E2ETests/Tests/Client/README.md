# Client Tests
This folder contains tests separated in their own "Shard" folder.

During CI/CD pipeline, each shard (and all tests assigned to it) executed in a separate VM.
This is done to speed up the execution of the tests.

When adding new tests, you can add them to an existing shard or create a new shard.

## Creating a new shard
To create a new shard, follow these steps:

1. Create a new folder in the `Tests` folder with the name of the shard. E.g. `Shard5`.
2. Change GitHub Actions workflow file for client tests:
   1. Open the file `.github/workflows/dotnet-e2e-client-tests.yml`.
   2. Find the `strategy` section. Add a new shard to the `matrix` section. E.g. when adding shard 5 update the line to the following:
      ```
      matrix:
      shard: [1, 2, 3, 4, 5]
      ```
3. The GitHub actions looks at the namespace of each test to know in what shard they should be executed in. Since the
   tests are placed in a folder with the shard name, the namespace should already be correct. However if there
   are any issues, verify that the namespace of the test is correct. E.g. for shard 5 the namespace of the test class should be:
```
namespace AliasVault.E2ETests.Tests.Client.Shard5;
```
