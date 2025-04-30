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

                                    if !viewModel.isChoosingTextToInsert {
                                        VStack(spacing: 12) {
                                            Button(action: {
                                                if let serviceUrl = viewModel.serviceUrl {
                                                    let encodedUrl = serviceUrl.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                                                    if let url = URL(string: "net.aliasvault.app://credentials/add-edit?serviceUrl=\(encodedUrl)") {
                                                        UIApplication.shared.open(url, options: [:], completionHandler: nil)
                                                    }
                                                }
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
            .navigationTitle(viewModel.isChoosingTextToInsert ? "Select Text to Insert" : "Select Credential")
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
                            if let serviceUrl = viewModel.serviceUrl {
                                let encodedUrl = serviceUrl.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                                if let url = URL(string: "net.aliasvault.app://credentials/add-edit?serviceUrl=\(encodedUrl)") {
                                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                                }
                            }
                        }
                        .foregroundColor(ColorConstants.Light.primary)
                    }
                }
            }
            .sheet(isPresented: $viewModel.showAddCredential) {
                AddCredentialView(viewModel: viewModel)
            }
            .actionSheet(isPresented: $viewModel.showSelectionOptions) {
                // Define all text strings


                guard let credential = viewModel.selectedCredential else {
                    return ActionSheet(title: Text("Select Login Method"), message: Text("No credential selected."), buttons: [.cancel()])
                }

                var buttons: [ActionSheet.Button] = []

                if viewModel.isChoosingTextToInsert {
                    if let username = credential.username, !username.isEmpty {
                        buttons.append(.default(Text("Username: \(username)")) {
                            viewModel.selectUsername()
                        })
                    }

                    if let email = credential.alias?.email, !email.isEmpty {
                        buttons.append(.default(Text("Email: \(email)")) {
                            viewModel.selectEmail()
                        })
                    }

                    buttons.append(.default(Text("Password")) {
                        viewModel.selectPassword()
                    })
                }
                else {
                    if let username = credential.username, !username.isEmpty {
                        buttons.append(.default(Text("Username: \(username)")) {
                            viewModel.selectUsernamePassword()
                        })
                    }

                    if let email = credential.alias?.email, !email.isEmpty {
                        buttons.append(.default(Text("Email: \(email)")) {
                            viewModel.selectEmailPassword()
                        })
                    }
                }

                buttons.append(.cancel())

                return ActionSheet(
                    title: viewModel.isChoosingTextToInsert ? Text("Select Text To Insert") : Text("Select Login Method"),
                    message: viewModel.isChoosingTextToInsert ? Text("Select the text to insert into the focused input field") : Text("Choose how you want to log in"),
                    buttons: buttons
                )
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
    @Published var showSelectionOptions = false
    @Published var selectedCredential: Credential?
    @Published public var isChoosingTextToInsert = false
    @Published public var serviceUrl: String?

    @Published var newUsername = ""
    @Published var newPassword = ""
    @Published var newService = ""

    private let loader: () async throws -> [Credential]
    private let selectionHandler: (String, String) -> Void
    private let cancelHandler: () -> Void

    public init(
        loader: @escaping () async throws -> [Credential],
        selectionHandler: @escaping (String, String) -> Void,
        cancelHandler: @escaping () -> Void,
        serviceUrl: String? = nil
    ) {
        self.loader = loader
        self.selectionHandler = selectionHandler
        self.cancelHandler = cancelHandler
        self.serviceUrl = serviceUrl
        if let url = serviceUrl {
            self.searchText = url
        }
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
        selectedCredential = credential

        // If we're in text insertion mode, always show the selection sheet
        if isChoosingTextToInsert {
            showSelectionOptions = true
            return
        }

        // If we only have one option, use it directly
        let username = credential.username?.trimmingCharacters(in: .whitespacesAndNewlines)
        let email = credential.alias?.email?.trimmingCharacters(in: .whitespacesAndNewlines)

        if (username?.isEmpty ?? true) || (email?.isEmpty ?? true) {
            let identifier = username?.isEmpty == false ? username! : (email ?? "")
            selectionHandler(identifier, credential.password?.value ?? "")
            return
        }

        // If we have both options, show selection sheet
        showSelectionOptions = true
    }

    func selectUsername() {
        guard let credential = selectedCredential else { return }
        selectionHandler(credential.username ?? "", "")
        showSelectionOptions = false
    }

    func selectEmail() {
        guard let credential = selectedCredential else { return }
        selectionHandler(credential.alias?.email ?? "", "")
        showSelectionOptions = false
    }

    func selectPassword() {
        guard let credential = selectedCredential else { return }
        selectionHandler(credential.password?.value ?? "", "")
        showSelectionOptions = false
    }

    func selectUsernamePassword() {
        guard let credential = selectedCredential else { return }
        selectionHandler(credential.username ?? "", credential.password?.value ?? "")
        showSelectionOptions = false
    }

    func selectEmailPassword() {
        guard let credential = selectedCredential else { return }
        selectionHandler(credential.alias?.email ?? "", credential.password?.value ?? "")
        showSelectionOptions = false
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
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                return previewCredentials
            },
            selectionHandler: { _, _ in },
            cancelHandler: {},
            serviceUrl: nil
        )

        credentials = previewCredentials
        filteredCredentials = previewCredentials
        isLoading = false
    }
}

struct CredentialProviderView_Previews: PreviewProvider {
    static func makePreview(isChoosing: Bool, showingSelection: Bool, colorScheme: ColorScheme) -> some View {
        let vm = PreviewCredentialProviderViewModel()
        vm.isChoosingTextToInsert = isChoosing
        if showingSelection {
            vm.selectedCredential = .preview
            vm.showSelectionOptions = true
        }
        return CredentialProviderView(viewModel: vm)
            .environment(\.colorScheme, colorScheme)
    }

    static var previews: some View {
        Group {
            makePreview(isChoosing: false, showingSelection: false, colorScheme: .light)
                .previewDisplayName("Light - Normal")
            makePreview(isChoosing: false, showingSelection: false, colorScheme: .dark)
                .previewDisplayName("Dark - Normal")
            makePreview(isChoosing: true, showingSelection: false, colorScheme: .light)
                .previewDisplayName("Light - Insert Text Mode")
            makePreview(isChoosing: true, showingSelection: true, colorScheme: .light)
                .previewDisplayName("Light - Insert Text Mode Selection")
            makePreview(isChoosing: false, showingSelection: true, colorScheme: .light)
                .previewDisplayName("Light - Selection Sheet")
        }
    }
}
