import SwiftUI
import AuthenticationServices
import VaultModels

public struct CredentialProviderView: View {
    @ObservedObject public var viewModel: CredentialProviderViewModel

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    
    public init(viewModel: CredentialProviderViewModel) {
         self._viewModel = ObservedObject(wrappedValue: viewModel)
    }

    public var body: some View {
        NavigationView {
            ZStack {
                (colorScheme == .dark ? ColorConstants.Dark.background : ColorConstants.Light.background)
                    .ignoresSafeArea()

                if viewModel.isLoading {
                    ProgressView("Loading credentials...")
                        .progressViewStyle(.circular)
                        .scaleEffect(1.5)
                } else {
                    VStack(spacing: 0) {
                        SearchBar(text: $viewModel.searchText)
                            .padding(.horizontal)
                            .padding(.vertical, 8)
                            .background(colorScheme == .dark ? ColorConstants.Dark.background : ColorConstants.Light.background)
                            .onChange(of: viewModel.searchText) { _ in
                                viewModel.filterCredentials()
                            }

                        ScrollView {
                            LazyVStack(spacing: 8) {
                                ForEach(viewModel.filteredCredentials, id: \.service) { credential in
                                    CredentialCard(credential: credential) {
                                        viewModel.selectCredential(credential)
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.top, 8)
                        }
                        .refreshable {
                            await viewModel.loadCredentials()
                        }
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
                    .foregroundColor(ColorConstants.Light.primary)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        Button {
                            Task { await viewModel.loadCredentials() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.icon : ColorConstants.Light.icon)
                        }

                        Button("Add") {
                            viewModel.showAddCredential = true
                        }
                        .foregroundColor(ColorConstants.Light.primary)
                    }
                }
            }
            .sheet(isPresented: $viewModel.showAddCredential) {
                AddCredentialView(viewModel: viewModel)
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {
                    viewModel.dismissError()
                }
            } message: {
                Text(viewModel.errorMessage)
            }
            .task {
                try? await Task.sleep(nanoseconds: 100_000_000)
                await viewModel.loadCredentials()
            }
            .onDisappear {
                viewModel.cancel()
            }
        }
    }
}

// MARK: - ViewModel

public class CredentialProviderViewModel: ObservableObject {
    @Published var credentials: [Credential] = []
    @Published var filteredCredentials: [Credential] = []
    @Published var searchText = ""
    @Published var isLoading = true
    @Published var showError = false
    @Published var errorMessage = ""
    @Published var showAddCredential = false

    @Published var newUsername = ""
    @Published var newPassword = ""
    @Published var newService = ""

    private let loader: () async throws -> [Credential]
    private let selectionHandler: (Credential) -> Void
    private let cancelHandler: () -> Void

    public init(
        loader: @escaping () async throws -> [Credential],
        selectionHandler: @escaping (Credential) -> Void,
        cancelHandler: @escaping () -> Void
    ) {
        self.loader = loader
        self.selectionHandler = selectionHandler
        self.cancelHandler = cancelHandler
    }

    @MainActor
    func loadCredentials() async {
        isLoading = true
        do {
            credentials = try await loader()
            filterCredentials()
            isLoading = false
        } catch {
            handleError(error)
        }
    }

    func filterCredentials() {
        if searchText.isEmpty {
            filteredCredentials = credentials
        } else {
            filteredCredentials = credentials.filter { credential in
                (credential.service.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (credential.username?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
    }

    func selectCredential(_ credential: Credential) {
        selectionHandler(credential)
    }

    func cancel() {
        cancelHandler()
    }

    func dismissError() {
        showError = false
    }

    private func handleError(_ error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.isLoading = false
            self?.errorMessage = error.localizedDescription
            self?.showError = true
        }
    }
}

// MARK: - AddCredentialView

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
                        //viewModel.addCredential()
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

// MARK: - SearchBar

struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)

            TextField("Search credentials...", text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)

            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
    }
}

// MARK: - Preview Helpers
extension Service {
    static var preview: Service {
        Service(
            id: UUID(),
            name: "Example Service",
            url: "https://example.com",
            logo: nil,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
    }
}

extension Password {
    static var preview: Password {
        Password(
            id: UUID(),
            credentialId: UUID(),
            value: "password123",
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
    }
}

extension Alias {
    static var preview: Alias {
        Alias(
            id: UUID(),
            gender: "Not specified",
            firstName: "John",
            lastName: "Doe",
            nickName: "JD",
            birthDate: Date(),
            email: "john@example.com",
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
    }
}

extension Credential {
    static var preview: Credential {
        Credential(
            id: UUID(),
            alias: .preview,
            service: .preview,
            username: "johndoe",
            notes: "Sample credential",
            password: .preview,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
    }
}

// Preview setup
class PreviewCredentialProviderViewModel: CredentialProviderViewModel {
    @Published var showSelectionAlert = false
    @Published var selectedCredentialInfo = ""
    @Published var showCancelAlert = false

    init() {
        let previewCredentials = [
            .preview,
            Credential(
                id: UUID(),
                alias: .preview,
                service: Service(
                    id: UUID(),
                    name: "Another Service",
                    url: "https://another.com",
                    logo: nil,
                    createdAt: Date(),
                    updatedAt: Date(),
                    isDeleted: false
                ),
                username: "anotheruser",
                notes: "Another sample credential",
                password: .preview,
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            )
        ]

        super.init(
            loader: {
                try? await Task.sleep(nanoseconds: 1_000_000_000) // Simulate network delay
                return previewCredentials
            },
            selectionHandler: { credential in
                print("Selected credential: \(credential)")
            },
            cancelHandler: {
                print("Canceled")
            }
        )

        self.credentials = previewCredentials
        self.filteredCredentials = previewCredentials
        self.isLoading = false
    }
}

struct CredentialProviderView_Previews: PreviewProvider {
    static var previews: some View {
        let viewModel = PreviewCredentialProviderViewModel()
        CredentialProviderView(viewModel: viewModel)
    }
}
