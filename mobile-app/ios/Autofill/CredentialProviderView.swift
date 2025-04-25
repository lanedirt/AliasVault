import SwiftUI
import AuthenticationServices

struct ColorConstants {
    struct Light {
        static let text = Color(hex: "#11181C")
        static let textMuted = Color(hex: "#4b5563")
        static let background = Color(hex: "#ffffff")
        static let accentBackground = Color(hex: "#fff")
        static let accentBorder = Color(hex: "#d1d5db")
        static let primary = Color(hex: "#f49541")
        static let secondary = Color(hex: "#6b7280")
        static let icon = Color(hex: "#687076")
    }

    struct Dark {
        static let text = Color(hex: "#ECEDEE")
        static let textMuted = Color(hex: "#9BA1A6")
        static let background = Color(hex: "#111827")
        static let accentBackground = Color(hex: "#1f2937")
        static let accentBorder = Color(hex: "#4b5563")
        static let primary = Color(hex: "#f49541")
        static let secondary = Color(hex: "#6b7280")
        static let icon = Color(hex: "#9BA1A6")
    }
}

struct CredentialProviderView: View {
    @ObservedObject var viewModel: CredentialProviderViewModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
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
                            LazyVStack(spacing: 12) {
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
                            viewModel.loadCredentials()
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
                            viewModel.loadCredentials()
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
                    viewModel.cancel()
                }
            } message: {
                Text(viewModel.errorMessage)
            }
            .task {
                try? await Task.sleep(nanoseconds: 100_000_000)
                viewModel.loadCredentials()
            }
            .onDisappear {
                viewModel.cancel()
            }
        }
    }
}

struct ServiceLogoView: View {
    let logoData: Data?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Group {
            if let logoData = logoData {
                if let image = UIImage(data: logoData) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 24, height: 24)
                } else if let svgString = String(data: logoData, encoding: .utf8),
                          svgString.contains("<svg") || svgString.contains("<?xml") {
                    // For SVG, we'll use a placeholder for now since SwiftUI doesn't have built-in SVG support
                    // In a real implementation, you might want to use a third-party SVG renderer
                    Circle()
                        .fill(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
                        )
                } else {
                    // Fallback for other formats
                    Circle()
                        .fill(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
                        )
                }
            } else {
                Circle()
                    .fill(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Circle()
                            .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
                    )
            }
        }
    }
}

struct CredentialCard: View {
    let credential: Credential
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Service logo
                ServiceLogoView(logoData: credential.service.logo)
                    .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text(credential.service.name ?? "Unknown Service")
                        .font(.headline)
                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)

                    Text(credential.username ?? "No username")
                        .font(.subheadline)
                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.textMuted : ColorConstants.Light.textMuted)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.icon : ColorConstants.Light.icon)
            }
            .padding(16)
            .background(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
            )
            .cornerRadius(12)
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

class CredentialProviderViewModel: ObservableObject {
    @Published var credentials: [Credential] = []
    @Published var filteredCredentials: [Credential] = []
    @Published var searchText = ""
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
            let vaultStore = VaultStore()

            // Initialize the DB. Note: this can prompt the user for biometric authentication.
            try vaultStore.initializeDatabase()

            credentials = try vaultStore.getAllCredentials()
            filteredCredentials = credentials

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
        guard let username = credential.username else {
            handleError(NSError(domain: "CredentialProvider", code: -1, userInfo: [NSLocalizedDescriptionKey: "Username is required"]))
            return
        }

        // Note: We need to get the password from the Password model
        // This will need to be updated once we have access to the Password model
        let passwordCredential = ASPasswordCredential(user: username, password: "")
        extensionContext?.completeRequest(withSelectedCredential: passwordCredential,
                                        completionHandler: nil)
    }

    func addCredential() {
        // Note: This will need to be updated to create proper Service and Password models
        // For now, we'll just create a basic credential
        let service = Service(
            id: UUID(),
            name: newService,
            url: nil,
            logo: nil,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
        
        let password = Password(
            id: UUID(),
            credentialId: UUID(), 
            value: newPassword,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )

        let credential = Credential(
            id: UUID(),
            aliasId: UUID(), // This should be provided by the system
            service: service,
            username: newUsername,
            notes: nil,
            password: password,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )

        do {
            let vaultStore = VaultStore()
            try vaultStore.addCredential(credential)
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

// Add Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
