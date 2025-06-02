import AuthenticationServices
import LocalAuthentication
import SwiftUI
import VaultStoreKit
import VaultUI
import VaultModels

/**
 * This class is the main entry point for the autofill extension.
 * It is responsible for displaying the credential provider view and handling user interactions.
 *
 * It also contains interface implementations for ASCredentialProviderViewController that allow
 * us to provide credentials to native system operations that request credentials (e.g. suggesting
 * logins in the keyboard).
 */
public class CredentialProviderViewController: ASCredentialProviderViewController {
    private var hostingController: UIHostingController<CredentialProviderView>?
    private var viewModel: CredentialProviderViewModel?
    private var isChoosingTextToInsert = false
    private var initialServiceUrl: String?

    override public func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        // Check if there is a stored vault. If not, it means the user has not logged in yet and we
        // should redirect to the main app login screen automatically.
        let vaultStore = VaultStore()

        if !sanityChecks(vaultStore: vaultStore) {
            // Sanity checks failed and dialog has been shown.
            // Do not open the view so return here.
            return
        }

        // Try to unlock the vault. If it fails, we return and do not show the dialog.
        do {
            try vaultStore.unlockVault()
        } catch {
            print("Failed to unlock vault: \(error)")
            self.extensionContext.cancelRequest(withError: NSError(
                domain: ASExtensionErrorDomain,
                code: ASExtensionError.failed.rawValue,
                userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]
            ))
            return
        }

        // Only set up the view if we haven't already
        if hostingController == nil {
            setupView(vaultStore: vaultStore)
        }
    }

    private func setupView(vaultStore: VaultStore) {
        // Create the ViewModel with injected behaviors
        let viewModel = CredentialProviderViewModel(
            loader: {
                return try await self.loadCredentials(vaultStore: vaultStore)
            },
            selectionHandler: { identifier, password in
                self.handleCredentialSelection(identifier: identifier, password: password)
            },
            cancelHandler: {
                self.handleCancel()
            },
            serviceUrl: initialServiceUrl
        )

        self.viewModel = viewModel

        let hostingController = UIHostingController(
            rootView: CredentialProviderView(viewModel: viewModel)
        )

        addChild(hostingController)
        view.addSubview(hostingController.view)

        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        hostingController.didMove(toParent: self)
        self.hostingController = hostingController
    }

    override public func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        let matchedDomains = serviceIdentifiers.map { $0.identifier.lowercased() }
        if let firstDomain = matchedDomains.first {
            initialServiceUrl = firstDomain

            // Set the search text to the first domain which will auto filter the credentials
            // to show the most likely credentials first as suggestion.
            viewModel?.setSearchFilter(firstDomain)

            // Set the service URL to the first domain which will be used to pass onto the
            // add credential view when the user taps the "+" button and prefill it with the
            // domain name.
            viewModel?.serviceUrl = firstDomain
        }
    }

    override public func prepareInterfaceForUserChoosingTextToInsert() {
        isChoosingTextToInsert = true
        viewModel?.isChoosingTextToInsert = true
    }

    override public func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        do {
            let vaultStore = VaultStore()
            let credentials = try vaultStore.getAllCredentials()

            if let matchingCredential = credentials.first(where: { credential in
                return credential.id.uuidString == credentialIdentity.recordIdentifier
            }) {
                // Use the identifier that matches the credential identity
                let identifier = credentialIdentity.user
                let passwordCredential = ASPasswordCredential(
                    user: identifier,
                    password: matchingCredential.password?.value ?? ""
                )
                self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
            } else {
                self.extensionContext.cancelRequest(
                    withError: NSError(
                        domain: ASExtensionErrorDomain,
                        code: ASExtensionError.credentialIdentityNotFound.rawValue
                    )
                )
            }
        } catch {
            self.extensionContext.cancelRequest(
                withError: NSError(
                    domain: ASExtensionErrorDomain,
                    code: ASExtensionError.failed.rawValue,
                    userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]
                )
            )
        }
    }

    /// This registers all known AliasVault credentials into iOS native credential storage, which iOS can then use to
    /// suggest autofill credentials when a user focuses an input field on a login form. These suggestions will then be s
    /// hown above the iOS keyboard, which saves the user one step.
    private func registerCredentialIdentities(credentials: [Credential]) async {
       do {
           try await CredentialIdentityStore.shared.saveCredentialIdentities(credentials)
       } catch {
           print("Failed to save credential identities: \(error)")
       }
   }

    /// Run sanity checks on the vault store before opening the autofill view to check things like if user is logged in,
    /// vault is available etc.
    /// - Returns
    ///  true if sanity checks succeeded and view can open
    ///  false if sanity checks failed and a notice windows has been shown.
    private func sanityChecks(vaultStore: VaultStore) -> Bool {
        if !vaultStore.hasEncryptedDatabase {
            let alert = UIAlertController(
                title: "Login Required",
                message: "To use Autofill, please login to your AliasVault account in the AliasVault app.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
                self?.extensionContext.cancelRequest(withError: NSError(
                    domain: ASExtensionErrorDomain,
                    code: ASExtensionError.userCanceled.rawValue
                ))
            })
            present(alert, animated: true)
            return false
        }

        // Check if Face ID/Touch ID is enabled
        let context = LAContext()
        var authMethod = "Face ID / Touch ID"
        var biometricsAvailable = false
        var biometricsError: NSError?

        // Check if device supports biometrics
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &biometricsError) {
            biometricsAvailable = true
            switch context.biometryType {
            case .faceID:
                authMethod = "Face ID"
            case .touchID:
                authMethod = "Touch ID"
            default:
                break
            }
        }

        // First check if biometrics are available on the device
        if !biometricsAvailable {
            let alert = UIAlertController(
                title: "\(authMethod) Required",
                message: "To use AliasVault Autofill, please enable \(authMethod) in your device settings and/or go to the AliasVault app settings to configure it.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
                self?.extensionContext.cancelRequest(withError: NSError(
                    domain: ASExtensionErrorDomain,
                    code: ASExtensionError.userCanceled.rawValue
                ))
            })
            present(alert, animated: true)
            return false
        }

        // Then check if Face ID/Touch ID is enabled in the app settings
        if !vaultStore.getAuthMethods().contains(.faceID) {
            let alert = UIAlertController(
                title: "\(authMethod) Required",
                message: "To use Autofill, please enable \(authMethod) as your vault unlock method in the AliasVault app settings.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
                self?.extensionContext.cancelRequest(withError: NSError(
                    domain: ASExtensionErrorDomain,
                    code: ASExtensionError.userCanceled.rawValue
                ))
            })
            present(alert, animated: true)
            return false
        }

        return true
    }

    /// Load credentials from the vault store and register them as credential identities
    /// and then return them to the caller (view model).
    private func loadCredentials(vaultStore: VaultStore) async throws -> [Credential] {
        let credentials = try vaultStore.getAllCredentials()
        await self.registerCredentialIdentities(credentials: credentials)
        return credentials
    }

    /// Handle autofill view credential selection.
    private func handleCredentialSelection(identifier: String, password: String) {
        if isChoosingTextToInsert {
            // For text insertion, insert only the selected text
            if #available(iOS 18.0, *) {
                self.extensionContext.completeRequest(
                    withTextToInsert: identifier,
                    completionHandler: nil
                )
            } else {
                // Fallback on earlier versions: do nothing as this feature
                // is not supported and we should not reach this point?
            }
        } else {
            // For regular credential selection
            let passwordCredential = ASPasswordCredential(
                user: identifier,
                password: password
            )
            self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
        }
    }

    /// Handle autofill view cancel action.
    private func handleCancel() {
        self.extensionContext.cancelRequest(withError: NSError(
            domain: ASExtensionErrorDomain,
            code: ASExtensionError.userCanceled.rawValue
        ))
    }
}
