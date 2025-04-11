import SwiftUI
import AuthenticationServices

struct CredentialProviderView: View {
    @ObservedObject var viewModel: CredentialProviderViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading credentials...")
                        .progressViewStyle(.circular)
                        .scaleEffect(1.5)
                } else {
                    List(viewModel.credentials, id: \.service) { credential in
                        Button(action: {
                            viewModel.selectCredential(credential)
                        }) {
                            VStack(alignment: .leading) {
                                Text(credential.service)
                                    .font(.headline)
                                Text(credential.username)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .refreshable {
                        viewModel.loadCredentials()
                    }
                }
            }
            .navigationTitle("Select Credential")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        viewModel.cancel()
                    }
                    .foregroundColor(.red)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        Button {
                            viewModel.loadCredentials()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        
                        Button("Add") {
                            viewModel.showAddCredential = true
                        }
                    }
                }
            }
            .sheet(isPresented: $viewModel.showAddCredential) {
                AddCredentialView(viewModel: viewModel)
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {
                    viewModel.cancel()
                }
            } message: {
                Text(viewModel.errorMessage)
            }
            .task {
                // wait for .1sec
                try? await Task.sleep(nanoseconds: 100_000_000)
                viewModel.loadCredentials()
            }
            .onDisappear {
                viewModel.cancel()
            }
        }
    }
}

struct AddCredentialView: View {
    @ObservedObject var viewModel: CredentialProviderViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Username", text: $viewModel.newUsername)
                    .textContentType(.username)
                    .autocapitalization(.none)
                
                SecureField("Password", text: $viewModel.newPassword)
                    .textContentType(.password)
                
                TextField("Service", text: $viewModel.newService)
                    .textContentType(.URL)
                    .autocapitalization(.none)
            }
            .navigationTitle("Add Credential")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        viewModel.addCredential()
                        dismiss()
                    }
                    .disabled(viewModel.newUsername.isEmpty || 
                            viewModel.newPassword.isEmpty || 
                            viewModel.newService.isEmpty)
                }
            }
        }
    }
}

class CredentialProviderViewModel: ObservableObject {
    @Published var credentials: [Credential] = []
    @Published var isLoading = true
    @Published var showError = false
    @Published var errorMessage = ""
    @Published var showAddCredential = false
    
    // New credential form fields
    @Published var newUsername = ""
    @Published var newPassword = ""
    @Published var newService = ""
    
    private var extensionContext: ASCredentialProviderExtensionContext?
    
    init(extensionContext: ASCredentialProviderExtensionContext? = nil) {
        self.extensionContext = extensionContext
    }
    
    func loadCredentials() {
        isLoading = true
        
        do {
            let sharedCredentialStore = SharedCredentialStore()
            credentials = try sharedCredentialStore.getAllCredentials()
            
            Task {
                do {
                    try await CredentialIdentityStore.shared.saveCredentialIdentities(credentials)
                    DispatchQueue.main.async { [weak self] in
                        self?.isLoading = false
                    }
                } catch {
                    await handleError(error)
                }
            }
        } catch {
            handleError(error)
        }
    }
    
    func selectCredential(_ credential: Credential) {
        let passwordCredential = ASPasswordCredential(user: credential.username, 
                                                    password: credential.password)
        extensionContext?.completeRequest(withSelectedCredential: passwordCredential, 
                                        completionHandler: nil)
    }
    
    func addCredential() {
        let credential = Credential(username: newUsername,
                                  password: newPassword,
                                  service: newService)
        
        do {
            let sharedCredentialStore = SharedCredentialStore()
            try sharedCredentialStore.addCredential(credential)
            Task {
                try await CredentialIdentityStore.shared.saveCredentialIdentities([credential])
            }
            loadCredentials()
            
            // Reset form
            newUsername = ""
            newPassword = ""
            newService = ""
        } catch {
            handleError(error)
        }
    }
    
    func cancel() {
        guard let context = extensionContext else {
            print("Error: extensionContext is nil")
            return
        }
        context.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain,
                                               code: ASExtensionError.userCanceled.rawValue))
    }
    
    private func handleError(_ error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.isLoading = false
            self?.errorMessage = error.localizedDescription
            self?.showError = true
        }
    }
} 
