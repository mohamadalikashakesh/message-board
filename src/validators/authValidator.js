
/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {string} The validated email
 * @throws {Error} If email is invalid
 */
export function validateEmail(email) {
  if (!email) {
    throw new Error('Email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return email.toLowerCase().trim();
}

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {string} The validated password
 * @throws {Error} If password is invalid
 */
export function validatePassword(password) {
  if (!password) {
    throw new Error('Password is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  return password;
}

/**
 * Validates a display name
 * @param {string} displayName - The display name to validate
 * @returns {string} The validated display name
 * @throws {Error} If display name is invalid
 */
export function validateDisplayName(displayName) {
  if (!displayName) {
    throw new Error('Display name is required');
  }

  if (displayName.length < 2) {
    throw new Error('Display name must be at least 2 characters long');
  }

  if (displayName.length > 50) {
    throw new Error('Display name must be less than 50 characters');
  }

  return displayName.trim();
}

/**
 * Validates a date of birth
 * @param {string} dateOfBirth - The date of birth to validate (YYYY-MM-DD format)
 * @returns {Date} The validated date of birth
 * @throws {Error} If date of birth is invalid
 */
export function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    throw new Error('Date of birth is required');
  }

  const date = new Date(dateOfBirth);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < 13) {
    throw new Error('Must be at least 13 years old');
  }

  if (age > 120) {
    throw new Error('Invalid date of birth');
  }

  return date;
}

/**
 * Calculates age from date of birth
 * @param {Date} dateOfBirth - The date of birth
 * @returns {number} The calculated age
 */
export function calculateAge(dateOfBirth) {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1;
  }
  
  return age;
}