import Foundation

public struct AuthMethods: OptionSet {
    public let rawValue: Int

    public init(rawValue: Int) {
        self.rawValue = rawValue
    }

    public static let faceID = AuthMethods(rawValue: 1 << 0)
    public static let password = AuthMethods(rawValue: 1 << 1)

    public static let all: AuthMethods = [.faceID, .password]
    public static let none: AuthMethods = []
}
