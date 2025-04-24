//
//  CredentialProviderViewController.swift
//  autofill
//
//  Created by Leendert de Borst on 08/04/2025.
//

import AuthenticationServices
import SwiftUI

class CredentialProviderViewController: ASCredentialProviderViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let viewModel = CredentialProviderViewModel(extensionContext: extensionContext)
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
        // This is handled in the SwiftUI view's onAppear
    }
    
    override func prepareInterfaceForUserChoosingTextToInsert() {
        // This is handled in the SwiftUI view's onAppear
    }
    
    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        // Get credentials and return the first one that matches the identity
        // TODO: how do we handle authentication here? We need Face ID access before we can access credentials..
        // so we probably actually need to have a .shared instance in the autofill extension where after one unlock
        // it stays unlocked? Or should we cache usernames locally and still require faceid as soon as user tries to
        // autofill the username? Check how this should work functionally.
        do {
            let credentials = try VaultStore.shared.getAllCredentials()
            if let matchingCredential = credentials.first(where: { $0.service == credentialIdentity.serviceIdentifier.identifier }) {
                let passwordCredential = ASPasswordCredential(
                    user: matchingCredential.username,
                    password: matchingCredential.password
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
}
