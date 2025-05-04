//
//  DateHelper.swift
//  VaultStoreKit
//
//  Created by Leendert de Borst on 04/05/2025.
//

import Foundation

/// DateHelper class which contains helper methods for date strings and objects.
public class DateHelper {
    public static func parseDateString(_ dateString: String) -> Date? {
        // Static date formatters for performance
        struct StaticFormatters {
            static let formatterWithMillis: DateFormatter = {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
                formatter.locale = Locale(identifier: "en_US_POSIX")
                formatter.timeZone = TimeZone(secondsFromGMT: 0)
                return formatter
            }()
            
            static let formatterWithoutMillis: DateFormatter = {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                formatter.locale = Locale(identifier: "en_US_POSIX")
                formatter.timeZone = TimeZone(secondsFromGMT: 0)
                return formatter
            }()
            
            static let isoFormatter: ISO8601DateFormatter = {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                formatter.timeZone = TimeZone(secondsFromGMT: 0)
                return formatter
            }()
        }
        
        let cleanedDateString = dateString.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // If ends with 'Z' or contains timezone, attempt ISO8601 parsing
        if cleanedDateString.contains("Z") || cleanedDateString.contains("+") || cleanedDateString.contains("-") {
            if let isoDate = StaticFormatters.isoFormatter.date(from: cleanedDateString) {
                return isoDate
            }
        }
        
        // Try parsing with milliseconds
        if let dateWithMillis = StaticFormatters.formatterWithMillis.date(from: cleanedDateString) {
            return dateWithMillis
        }
        
        // Try parsing without milliseconds
        if let dateWithoutMillis = StaticFormatters.formatterWithoutMillis.date(from: cleanedDateString) {
            return dateWithoutMillis
        }
        
        // If parsing still fails, return nil
        return nil
    }
}
