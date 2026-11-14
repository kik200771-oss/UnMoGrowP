/**
 * Password Generation Utilities
 *
 * Generates secure, user-friendly passwords for registration
 */

/**
 * Character sets for password generation
 */
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*';

/**
 * Generate a cryptographically secure random password
 *
 * @param length Password length (default: 12)
 * @param options Password generation options
 * @returns Generated password string
 */
export function generatePassword(length: number = 12, options: {
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
} = {}): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true
  } = options;

  // Build character set based on options
  let charset = '';
  if (includeUppercase) charset += UPPERCASE;
  if (includeLowercase) charset += LOWERCASE;
  if (includeNumbers) charset += NUMBERS;
  if (includeSymbols) charset += SYMBOLS;

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  // Generate password using crypto.getRandomValues for security
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Ensure at least one character from each selected type
  password = ensureCharacterTypes(password, {
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols
  });

  return password;
}

/**
 * Generate a user-friendly password (easier to read/type)
 * Avoids ambiguous characters like 0, O, I, l
 */
export function generateUserFriendlyPassword(length: number = 12): string {
  const friendlyUppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // No I, O
  const friendlyLowercase = 'abcdefghjkmnpqrstuvwxyz'; // No i, l, o
  const friendlyNumbers = '23456789'; // No 0, 1
  const friendlySymbols = '!@#$%^&*'; // Keep simple symbols

  const charset = friendlyUppercase + friendlyLowercase + friendlyNumbers + friendlySymbols;

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

/**
 * Generate a memorable password using word patterns
 * Format: Word-Number-Word-Symbol (e.g., "Storm-42-Cloud-!")
 */
export function generateMemorablePassword(): string {
  const words = [
    'Storm', 'Cloud', 'River', 'Mountain', 'Forest', 'Ocean', 'Fire', 'Wind',
    'Light', 'Shadow', 'Crystal', 'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf',
    'Moon', 'Star', 'Sun', 'Earth', 'Ice', 'Thunder', 'Flash', 'Bolt'
  ];

  const symbols = ['!', '@', '#', '$', '%', '^', '&', '*'];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(Math.random() * 99) + 10; // 10-99
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];

  return `${word1}-${number}-${word2}-${symbol}`;
}

/**
 * Ensure password contains at least one character from each required type
 */
function ensureCharacterTypes(password: string, options: {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}): string {
  const chars = password.split('');
  const replacements: { index: number; char: string }[] = [];

  if (options.includeUppercase && !/[A-Z]/.test(password)) {
    replacements.push({
      index: Math.floor(Math.random() * chars.length),
      char: UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]
    });
  }

  if (options.includeLowercase && !/[a-z]/.test(password)) {
    replacements.push({
      index: Math.floor(Math.random() * chars.length),
      char: LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]
    });
  }

  if (options.includeNumbers && !/[0-9]/.test(password)) {
    replacements.push({
      index: Math.floor(Math.random() * chars.length),
      char: NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    });
  }

  if (options.includeSymbols && !/[!@#$%^&*]/.test(password)) {
    replacements.push({
      index: Math.floor(Math.random() * chars.length),
      char: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    });
  }

  // Apply replacements
  replacements.forEach(replacement => {
    chars[replacement.index] = replacement.char;
  });

  return chars.join('');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-100
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length scoring
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else if (password.length >= 6) score += 10;
  else feedback.push('Password should be at least 8 characters long');

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  else feedback.push('Add special characters');

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  if (/123|234|345|456|567|678|789|890/.test(password)) {
    score -= 15;
    feedback.push('Avoid sequential characters');
  }

  // Determine level
  let level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  if (score >= 90) level = 'Very Strong';
  else if (score >= 75) level = 'Strong';
  else if (score >= 60) level = 'Good';
  else if (score >= 45) level = 'Fair';
  else if (score >= 30) level = 'Weak';
  else level = 'Very Weak';

  return { score: Math.max(0, score), level, feedback };
}