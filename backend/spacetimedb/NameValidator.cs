using System;
using System.Collections.Generic;
using System.Linq;

public static class NameValidator
{
    private static readonly HashSet<string> InappropriateWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "fuck", "shit", "ass", "bitch", "damn", "hell", "crap", "piss",
        "dick", "cock", "pussy", "cunt", "fag", "slut", "whore", "bastard",
        "nigger", "nigga", "chink", "spic", "kike", "retard", "rape",
        "nazi", "hitler", "kkk", "penis", "vagina", "sex", "porn",
        "kill", "die", "death", "suicide", "murder", "terrorist"
    };

    public static bool ContainsInappropriateContent(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        var normalizedName = name.ToLowerInvariant();
        normalizedName = RemoveLeetSpeak(normalizedName);
        normalizedName = RemoveSpecialCharacters(normalizedName);

        foreach (var word in InappropriateWords)
        {
            if (normalizedName.Contains(word))
            {
                return true;
            }
        }

        return false;
    }

    private static string RemoveLeetSpeak(string input)
    {
        var result = input
            .Replace("0", "o")
            .Replace("1", "i")
            .Replace("3", "e")
            .Replace("4", "a")
            .Replace("5", "s")
            .Replace("7", "t")
            .Replace("@", "a")
            .Replace("$", "s");
        
        return result;
    }

    private static string RemoveSpecialCharacters(string input)
    {
        return new string(input.Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c)).ToArray());
    }
}
