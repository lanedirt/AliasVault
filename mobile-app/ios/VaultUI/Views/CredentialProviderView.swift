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
                            if viewModel.filteredCredentials.isEmpty {
                                VStack(spacing: 20) {
                                    Image(systemName: "magnifyingglass")
                                        .font(.system(size: 50))
                                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)

                                    Text("No credentials found")
                                        .font(.headline)
                                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)

                                    Text("No existing credentials match your search")
                                        .font(.subheadline)
                                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)
                                        .multilineTextAlignment(.center)

                                    VStack(spacing: 12) {
                                        Button(action: {
                                            viewModel.showAddCredential = true
                                        }) {
                                            HStack {
                                                Image(systemName: "plus.circle.fill")
                                                Text("Create New Credential")
                                            }
                                            .padding()
                                            .frame(maxWidth: .infinity)
                                            .background(ColorConstants.Light.primary)
                                            .foregroundColor(.white)
                                            .cornerRadius(8)
                                        }
                                    }
                                    .padding(.horizontal, 40)
                                }
                                .padding(.top, 60)
                            } else {
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
    public func setSearchFilter(_ text: String) {
        self.searchText = text
        self.filterCredentials()
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
            return
        }

        func extractRootDomain(from urlString: String) -> String? {
            guard let url = URL(string: urlString), let host = url.host else { return nil }
            let parts = host.components(separatedBy: ".")
            return parts.count >= 2 ? parts.suffix(2).joined(separator: ".") : host
        }

        func extractDomainWithoutExtension(from domain: String) -> String {
            return domain.components(separatedBy: ".").first ?? domain
        }

        if let searchUrl = URL(string: searchText), let hostname = searchUrl.host, !hostname.isEmpty {
            let baseUrl = "\(searchUrl.scheme ?? "https")://\(hostname)"
            let rootDomain = extractRootDomain(from: searchUrl.absoluteString) ?? hostname
            let domainWithoutExtension = extractDomainWithoutExtension(from: rootDomain)

            // 1. Exact URL match
            var matches = credentials.filter { credential in
                if let serviceUrl = credential.service.url,
                   let url = URL(string: serviceUrl) {
                    return url.absoluteString.lowercased() == searchUrl.absoluteString.lowercased()
                }
                return false
            }

            // 2. Base URL match (excluding query/path)
            if matches.isEmpty {
                matches = credentials.filter { credential in
                    if let serviceUrl = credential.service.url,
                       let url = URL(string: serviceUrl) {
                        return url.absoluteString.lowercased().hasPrefix(baseUrl.lowercased())
                    }
                    return false
                }
            }

            // 3. Root domain match (e.g., coolblue.nl)
            if matches.isEmpty {
                matches = credentials.filter { credential in
                    if let serviceUrl = credential.service.url,
                       let credRootDomain = extractRootDomain(from: serviceUrl) {
                        return credRootDomain.lowercased() == rootDomain.lowercased()
                    }
                    return false
                }
            }

            // 4. Domain name part match (e.g., "coolblue" in service name)
            if matches.isEmpty {
                matches = credentials.filter { credential in
                    if let serviceName = credential.service.name?.lowercased() {
                        return serviceName.contains(domainWithoutExtension.lowercased()) ||
                               domainWithoutExtension.lowercased().contains(serviceName)
                    }
                    return false
                }
            }

            filteredCredentials = matches
        } else {
            // Non-URL fallback: simple text search in service name or username
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
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)
                    .padding(.leading, 8)

                TextField("Search credentials...", text: $text)
                    .autocapitalization(.none)
                    .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)
                    .padding(.leading, 4)
                    .padding(.trailing, 28) // Space for clear button
            }
            .padding(8)
            .padding(.vertical, 2)
            .background(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.accentBackground)
            .cornerRadius(8)

            if !text.isEmpty {
                HStack {
                    Spacer()
                    Button(action: {
                        text = ""
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)
                    }
                    .padding(.trailing, 8)
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
            ),
            Credential(
                id: UUID(),
                alias: .preview,
                service: Service(
                    id: UUID(),
                    name: "Long name service with a lot of characters",
                    url: "https://another.com",
                    logo: nil,
                    createdAt: Date(),
                    updatedAt: Date(),
                    isDeleted: false
                ),
                username: "usernameisalsoprettylongjusttoseewhathappens",
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
