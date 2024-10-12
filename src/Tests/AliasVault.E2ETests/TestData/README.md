This folder contains test data for the AliasVault.E2ETests project.
The build action of these is set to "Embedded resource" so that they can be accessed by the tests
using the `ResourceReaderUtility` class.

Index:
- `AliasClientDb_encrypted_base64_1.0.0` - Encrypted vault blob with client db version 1.0.0 used to test client db upgrade paths. This vault contains two test credentials that are checked in the tests after local client db upgrade.
- `TestAttachment.txt` - Test attachment file that is uploaded during test.
