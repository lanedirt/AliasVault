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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadCredentials()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
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
        
        // Setup Constraints
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: addButton.topAnchor),
            
            addButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            addButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            addButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            addButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    private func loadCredentials() {
        credentials = SharedCredentialStore.shared.getAllCredentials()
        tableView.reloadData()
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
            SharedCredentialStore.shared.addCredential(credential)
            self?.loadCredentials()
        })
        
        present(alert, animated: true)
    }
    
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        loadCredentials()
    }
    
    @IBAction func cancel(_ sender: AnyObject?) {
        self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }
    
    override func prepareInterfaceForUserChoosingTextToInsert() {
        loadCredentials()
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
