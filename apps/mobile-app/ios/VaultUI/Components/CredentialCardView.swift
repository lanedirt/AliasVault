//
//  CredentialCardView.swift
//  AliasVault
//
//  Created by Leendert de Borst on 27/04/2025.
//
import SwiftUI
import VaultModels

struct CredentialCard: View {
    let credential: Credential
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme
    @State private var showCopyToast = false
    @State private var copyToastMessage = ""

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Service logo
                ServiceLogoView(logoData: credential.service.logo)
                    .frame(width: 32, height: 32)

                VStack(alignment: .leading, spacing: 4) {
                    Text(truncateText(credential.service.name ?? "Unknown", limit: 26))
                        .font(.headline)
                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.text : ColorConstants.Light.text)

                    Text(truncateText(usernameOrEmail(credential: credential), limit: 26))
                        .font(.subheadline)
                        .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.textMuted : ColorConstants.Light.textMuted)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(colorScheme == .dark ? ColorConstants.Dark.icon : ColorConstants.Light.icon)
            }
            .padding(8)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(colorScheme == .dark ? ColorConstants.Dark.accentBackground : ColorConstants.Light.background)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(colorScheme == .dark ? ColorConstants.Dark.accentBorder : ColorConstants.Light.accentBorder, lineWidth: 1)
            )
            .cornerRadius(8)
        }
        .contextMenu {
            Button(action: {
                if let username = credential.username {
                    UIPasteboard.general.string = username
                    copyToastMessage = "Username copied"
                    showCopyToast = true
                }
            }) {
                Label("Copy Username", systemImage: "person")
            }

            Button(action: {
                if let password = credential.password?.value {
                    UIPasteboard.general.string = password
                    copyToastMessage = "Password copied"
                    showCopyToast = true
                }
            }) {
                Label("Copy Password", systemImage: "key")
            }

            Button(action: {
                if let email = credential.alias?.email {
                    UIPasteboard.general.string = email
                    copyToastMessage = "Email copied"
                    showCopyToast = true
                }
            }) {
                Label("Copy Email", systemImage: "envelope")
            }

            Divider()

            Button(action: {
                if let url = URL(string: "aliasvault://credentials/\(credential.id.uuidString)") {
                    UIApplication.shared.open(url)
                }
            }) {
                Label("View Details", systemImage: "eye")
            }

            Button(action: {
                if let url = URL(string: "aliasvault://credentials/add-edit?id=\(credential.id.uuidString)") {
                    UIApplication.shared.open(url)
                }
            }) {
                Label("Edit", systemImage: "pencil")
            }
        }
        .overlay(
            Group {
                if showCopyToast {
                    VStack {
                        Spacer()
                        Text(copyToastMessage)
                            .padding()
                            .background(Color.black.opacity(0.7))
                            .foregroundColor(.white)
                            .cornerRadius(8)
                            .padding(.bottom, 20)
                    }
                    .transition(.opacity)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            withAnimation {
                                showCopyToast = false
                            }
                        }
                    }
                }
            }
        )
    }
}

func usernameOrEmail(credential: Credential) -> String {
    if let username = credential.username, !username.isEmpty {
        return username
    }
    if let email = credential.alias?.email, !email.isEmpty {
        return email
    }
    return ""
}

func truncateText(_ text: String?, limit: Int) -> String {
    guard let text = text else { return "" }
    if text.count > limit {
        let index = text.index(text.startIndex, offsetBy: limit)
        return String(text[..<index]) + "..."
    } else {
        return text
    }
}

#Preview {
    CredentialCard(
        credential: Credential(
            id: UUID(),
            alias: Alias(
                id: UUID(),
                gender: "Male",
                firstName: "John",
                lastName: "Doe",
                nickName: "Johnny",
                birthDate: Date(),
                email: "john.doe@example.com",
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            service: Service(
                id: UUID(),
                name: "Example Service with a very long name bla bla bla",
                url: "https://example.com",
                logo: nil,
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            username: "usernameverylongverylongtextindeed",
            notes: "Sample notes",
            password: Password(
                id: UUID(),
                credentialId: UUID(),
                value: "securepassword123",
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        ),
        action: {}
    )
}

