//
//  CredentialProviderViewController.swift
//  autofill
//
//  Created by Leendert de Borst on 08/04/2025.
//

import AuthenticationServices
import UIKit

class CredentialProviderViewController: ASCredentialProviderViewController {
    private var credentials: [Credential] = []
    private let tableView = UITableView()
    private let addButton = UIButton(type: .system)
    private let loadButton = UIButton(type: .system)
    private let loadingIndicator = UIActivityIndicatorView(style: .large)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        loadCredentials()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Setup Loading Indicator
        loadingIndicator.hidesWhenStopped = false
        loadingIndicator.color = .systemBlue
        view.addSubview(loadingIndicator)
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.startAnimating()
        
        // Setup TableView
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "CredentialCell")
        view.addSubview(tableView)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup Add Button
        addButton.setTitle("Add Credential", for: .normal)
        addButton.addTarget(self, action: #selector(addCredentialTapped), for: .touchUpInside)
        view.addSubview(addButton)
        addButton.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup Load Button
        loadButton.setTitle("Load Credentials", for: .normal)
        loadButton.addTarget(self, action: #selector(loadCredentials), for: .touchUpInside)
        view.addSubview(loadButton)
        loadButton.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup Constraints
        NSLayoutConstraint.activate([
            loadingIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: loadButton.topAnchor),
            
            loadButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            loadButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            loadButton.bottomAnchor.constraint(equalTo: addButton.topAnchor, constant: -8),
            loadButton.heightAnchor.constraint(equalToConstant: 44),
            
            addButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            addButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            addButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            addButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    @objc private func loadCredentials() {        
        do {
            credentials = try SharedCredentialStore.shared.getAllCredentials(createKeyIfNeeded: false)
            // Update credential identities in the system
            Task {
                try await CredentialIdentityStore.shared.saveCredentialIdentities(credentials)
                DispatchQueue.main.async { [weak self] in
                    self?.loadingIndicator.stopAnimating()
                    self?.tableView.isHidden = false
                    self?.tableView.reloadData()
                }
            }
        } catch let error as NSError {
            loadingIndicator.stopAnimating()
            let errorAlert = UIAlertController(
                title: "Error Loading Credentials",
                message: error.localizedDescription,
                preferredStyle: .alert
            )
            errorAlert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
                self?.extensionContext.cancelRequest(withError: error)
            })
            present(errorAlert, animated: true)
        }
    }
    
    @objc private func addCredentialTapped() {
        let alert = UIAlertController(title: "Add Credential", message: nil, preferredStyle: .alert)
        
        alert.addTextField { textField in
            textField.placeholder = "Username"
        }
        alert.addTextField { textField in
            textField.placeholder = "Password"
            textField.isSecureTextEntry = true
        }
        alert.addTextField { textField in
            textField.placeholder = "Service"
        }
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Add", style: .default) { [weak self] _ in
            guard let username = alert.textFields?[0].text,
                  let password = alert.textFields?[1].text,
                  let service = alert.textFields?[2].text,
                  !username.isEmpty, !password.isEmpty, !service.isEmpty else { return }
            
            let credential = Credential(username: username, password: password, service: service)
            do {
                try SharedCredentialStore.shared.addCredential(credential, createKeyIfNeeded: false)
                // Update credential identities in the system
                Task {
                    try await CredentialIdentityStore.shared.saveCredentialIdentities([credential])
                }
            } catch let error as NSError {
                let errorAlert = UIAlertController(
                    title: "Error Adding Credential",
                    message: error.localizedDescription,
                    preferredStyle: .alert
                )
                errorAlert.addAction(UIAlertAction(title: "OK", style: .default))
                self?.present(errorAlert, animated: true)
                return
            }
            self?.loadCredentials()
        })
        
        present(alert, animated: true)
    }
    
    @objc private func cancelTapped() {
        extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }
    
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        // Loading it from here doesn't play well with the
        //loadCredentials()
    }
    
    override func prepareInterfaceForUserChoosingTextToInsert() {
        loadCredentials()
    }
    
    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        loadCredentials()
        
        // For testing purposes: we just return the first credential.
        if let firstCredential = credentials.first {
            let passwordCredential = ASPasswordCredential(user: firstCredential.username, password: firstCredential.password)
            self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
        } else {
            self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.credentialIdentityNotFound.rawValue))
        }
    }
}

extension CredentialProviderViewController: UITableViewDelegate, UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return credentials.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "CredentialCell", for: indexPath)
        let credential = credentials[indexPath.row]
        cell.textLabel?.text = "\(credential.service) - \(credential.username)"
        return cell
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let credential = credentials[indexPath.row]
        let passwordCredential = ASPasswordCredential(user: credential.username, password: credential.password)
        self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
    }
}
