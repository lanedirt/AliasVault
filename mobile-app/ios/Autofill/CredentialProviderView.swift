import SwiftUI
import AuthenticationServices
import Macaw

let placeholderImageBase64 = "UklGRjoEAABXRUJQVlA4IC4EAAAwFwCdASqAAIAAPpFCm0olo6Ihp5IraLASCWUA0eb/0s56RrLtCnYfLPiBshdXWMx8j1Ez65f169iA4xUDBTEV6ylMQeCIj2b7RngGi7gKZ9WjKdSoy9R8JcgOmjCMlDmLG20KhNo/i/Dc/Ah5GAvGfm8kfniV3AkR6fxN6eKwjDc6xrDgSfS48G5uGV6WzQt24YAVlLSK9BMwndzfHnePK1KFchFrL7O3ulB8cGNCeomu4o+l0SrS/JKblJ4WTzj0DAD++lCUEouSfgRKdiV2TiYCD+H+l3tANKSPQFPQuzi7rbvxqGeRmXB9kDwURaoSTTpYjA9REMUi9uA6aV7PWtBNXgUzMLowYMZeos6Xvyhb34GmufswMHA5ZyYpxzjTphOak4ZjNOiz8aScO5ygiTx99SqwX/uL+HSeVOSraHw8IymrMwm+jLxqN8BS8dGcItLlm/ioulqH2j4V8glDgSut+ExkxiD7m8TGPrrjCQNJbRDzpOFsyCyfBZupvp8QjGKW2KGziSZeIWes4aTB9tRmeEBhnUrmTDZQuXcc67Fg82KHrSfaeeOEq6jjuUjQ8wUnzM4Zz3dhrwSyslVz/WvnKqYkr4V/TTXPFF5EjF4rM1bHZ8bK63EfTnK41+n3n4gEFoYP4mXkNH0hntnYcdTqiE7Gn+q0BpRRxnkpBSZlA6Wa70jpW0FGqkw5e591A5/H+OV+60WAo+4Mi+NlsKrvLZ9EiVaPnoEFZlJQx1fA777AJ2MjXJ4KSsrWDWJi1lE8yPs8V6XvcC0chDTYt8456sKXAagCZyY+fzQriFMaddXyKQdG8qBqcdYjAsiIcjzaRFBBoOK9sU+sFY7N6B6+xtrlu3c37rQKkI3O2EoiJOris54EjJ5OFuumA0M6riNUuBf/MEPFBVx1JRcUEs+upEBsCnwYski7FT3TTqHrx7v5AjgFN97xhPTkmVpu6sxRnWBi1fxIRp8eWZeFM6mUcGgVk1WeVb1yhdV9hoMo2TsNEPE0tHo/wvuSJSzbZo7wibeXM9v/rRfKcx7X93rfiXVnyQ9f/5CaAQ4lxedPp/6uzLtOS4FyL0bCNeZ6L5w+AiuyWCTDFIYaUzhwfG+/YTQpWyeZCdQIKzhV+3GeXI2cxoP0ER/DlOKymf1gm+zRU3sqf1lBVQ0y+mK/Awl9bS3uaaQmI0FUyUwHUKP7PKuXnO+LcwDv4OfPT6hph8smc1EtMe5ib/apar/qZ9dyaEaElALJ1KKxnHziuvVl8atk1fINSQh7OtXDyqbPw9o/nGIpTnv5iFmwmWJLis2oyEgPkJqyx0vYI8rjkVEzKc8eQavAJBYSpjMwM193Swt+yJyjvaGYWPnqExxKiNarpB2WSO7soCAZXhS1uEYHryrK47BH6W1dRiruqT0xpLih3MXiwU3VDwAAAA=="

// Add Color extension for hex support
extension SwiftUI.Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct ColorConstants {
    struct Light {
        static let text = SwiftUI.Color(hex: "#11181C")
        static let textMuted = SwiftUI.Color(hex: "#4b5563")
        static let background = SwiftUI.Color(hex: "#ffffff")
        static let accentBackground = SwiftUI.Color(hex: "#fff")
        static let accentBorder = SwiftUI.Color(hex: "#d1d5db")
        static let primary = SwiftUI.Color(hex: "#f49541")
        static let secondary = SwiftUI.Color(hex: "#6b7280")
        static let icon = SwiftUI.Color(hex: "#687076")
    }

    struct Dark {
        static let text = SwiftUI.Color(hex: "#ECEDEE")
        static let textMuted = SwiftUI.Color(hex: "#9BA1A6")
        static let background = SwiftUI.Color(hex: "#111827")
        static let accentBackground = SwiftUI.Color(hex: "#1f2937")
        static let accentBorder = SwiftUI.Color(hex: "#4b5563")
        static let primary = SwiftUI.Color(hex: "#f49541")
        static let secondary = SwiftUI.Color(hex: "#6b7280")
        static let icon = SwiftUI.Color(hex: "#9BA1A6")
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

    private var placeholderImage: UIImage? {
        if let data = Data(base64Encoded: placeholderImageBase64) {
            return UIImage(data: data)
        }
        return nil
    }

    private func detectMimeType(_ data: Data) -> String {
        // Check for SVG
        if let str = String(data: data.prefix(5), encoding: .utf8)?.lowercased(),
           str.contains("<?xml") || str.contains("<svg") {
            return "image/svg+xml"
        }

        // Check file signature for PNG
        let bytes = [UInt8](data.prefix(4))
        if bytes.count >= 4 &&
            bytes[0] == 0x89 && bytes[1] == 0x50 &&
            bytes[2] == 0x4E && bytes[3] == 0x47 {
            return "image/png"
        }

        return "image/x-icon"
    }

    private func renderSVGNode(_ data: Data) -> Node? {
        if let svgString = String(data: data, encoding: .utf8) {
            return try? SVGParser.parse(text: svgString)
        }
        return nil
    }

    struct SVGImageView: UIViewRepresentable {
        let node: Node

        func makeUIView(context: Context) -> MacawView {
            let macawView = MacawView(node: node, frame: CGRect(x: 0, y: 0, width: 32, height: 32))
            macawView.backgroundColor = .clear
            macawView.contentMode = .scaleAspectFit
            macawView.node.place = Transform.identity
            return macawView
        }

        func updateUIView(_ uiView: MacawView, context: Context) {
            uiView.node = node
            uiView.backgroundColor = .clear
            uiView.contentMode = .scaleAspectFit
            uiView.node.place = Transform.identity
        }
    }

    var body: some View {
        Group {
            if let logoData = logoData {
                let mimeType = detectMimeType(logoData)
                if mimeType == "image/svg+xml",
                   let svgNode = renderSVGNode(logoData) {
                    SVGImageView(node: svgNode)
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                } else if let image = UIImage(data: logoData) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                } else if let placeholder = placeholderImage {
                    Image(uiImage: placeholder)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius:4))
                }
            } else if let placeholder = placeholderImage {
                Image(uiImage: placeholder)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
            } else {
                // Ultimate fallback if placeholder fails to load
                Circle()
                    .fill(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Circle()
                            .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 4))
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
                    .frame(width: 32, height: 32)

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
            .padding(12)
            .background(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
            )
            .cornerRadius(8)
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
        let passwordCredential = ASPasswordCredential(user: username, password: credential.password?.value ?? "")
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

        let alias = Alias(
            id: UUID(),
            gender: nil,
            firstName: nil,
            lastName: nil,
            nickName: nil,
            birthDate: Date(),
            email: nil,
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )

        let credential = Credential(
            id: UUID(),
            alias: alias,
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

// MARK: - Preview Helpers
extension Service {
    static var preview: Service {
        Service(
            id: UUID(),
            name: "Example Service",
            url: "https://example.com",
            logo: Data(base64Encoded: placeholderImageBase64),
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

class PreviewCredentialProviderViewModel: CredentialProviderViewModel {
    override init(extensionContext: ASCredentialProviderExtensionContext? = nil) {
        super.init(extensionContext: nil)
        self.credentials = [
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
        self.filteredCredentials = self.credentials
        self.isLoading = false
    }
}

struct CredentialProviderView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light mode preview
            CredentialProviderView(viewModel: PreviewCredentialProviderViewModel())
                .preferredColorScheme(.light)
                .previewDisplayName("Light Mode")

            // Dark mode preview
            CredentialProviderView(viewModel: PreviewCredentialProviderViewModel())
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")

            // Loading state preview
            CredentialProviderView(viewModel: {
                let vm = PreviewCredentialProviderViewModel()
                vm.isLoading = true
                return vm
            }())
            .previewDisplayName("Loading State")

            // Empty state preview
            CredentialProviderView(viewModel: {
                let vm = PreviewCredentialProviderViewModel()
                vm.credentials = []
                vm.filteredCredentials = []
                return vm
            }())
            .previewDisplayName("Empty State")

            // Search state preview
            CredentialProviderView(viewModel: {
                let vm = PreviewCredentialProviderViewModel()
                vm.searchText = "john"
                vm.filterCredentials()
                return vm
            }())
            .previewDisplayName("Search State")
        }
    }
}
