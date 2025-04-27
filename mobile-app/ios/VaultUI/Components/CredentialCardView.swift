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
                name: "Example Service",
                url: "https://example.com",
                logo: nil,
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            username: "johndoe",
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

