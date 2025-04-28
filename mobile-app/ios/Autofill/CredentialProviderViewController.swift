//
//  CredentialProviderViewController.swift
//  autofill
//
//  Created by Leendert de Borst on 08/04/2025.
//

import AuthenticationServices
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
class CredentialProviderViewController: ASCredentialProviderViewController {
    private var viewModel: CredentialProviderViewModel?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Create the ViewModel with INJECTED behaviors
        let viewModel = CredentialProviderViewModel(
          loader: {
              try VaultStore.shared.initializeDatabase()
              let credentials = try VaultStore.shared.getAllCredentials()
              await self.registerCredentialIdentities(credentials: credentials)
              return credentials
          },
          selectionHandler: { [weak self] credential in
              guard let self = self else { return }
              let passwordCredential = ASPasswordCredential(
                  user: credential.username ?? "",
                  password: credential.password?.value ?? ""
              )
              self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
          },
          cancelHandler: { [weak self] in
              guard let self = self else { return }
              self.extensionContext.cancelRequest(withError: NSError(
                  domain: ASExtensionErrorDomain,
                  code: ASExtensionError.userCanceled.rawValue
              ))
          }
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
    }

    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        guard let viewModel = self.viewModel else { return }

        // Instead of directly filtering credentials, just set the search text
        let matchedDomains = serviceIdentifiers.map { $0.identifier.lowercased() }
        if let firstDomain = matchedDomains.first {
            viewModel.setSearchFilter(firstDomain)
        }
    }

    override func prepareInterfaceForUserChoosingTextToInsert() {
        // This is handled in the SwiftUI view's onAppear
    }

    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        do {
            let credentials = try VaultStore.shared.getAllCredentials()
            
            if let matchingCredential = credentials.first(where: { credential in
                return credential.id.uuidString == credentialIdentity.recordIdentifier
            }) {
                let passwordCredential = ASPasswordCredential(
                    user: matchingCredential.username ?? "",
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
    
    /**
     * This registers all known AliasVault credentials into iOS native credential storage, which iOS can then use to suggest autofill credentials when a user
     * focuses an input field on a login form. These suggestions will then be shown above the iOS keyboard, which saves the user one step.
     */
    private func registerCredentialIdentities(credentials: [Credential]) async {
       do {
           try await CredentialIdentityStore.shared.saveCredentialIdentities(credentials)
       } catch {
           print("Failed to save credential identities: \(error)")
       }
   }
}
