/**
 * Utility script to set verification mark status for a user
 * 
 * This is a sample script that can be used in Firebase Functions or an admin panel
 * to set a user's verification status.
 * 
 * Usage:
 * 1. Import the Firebase Admin SDK
 * 2. Call setBluemark(userId, true/false)
 */

const admin = require('firebase-admin');

/**
 * Set the verification mark status for a user
 * @param {string} userId - The Firebase user ID 
 * @param {boolean} status - Whether to enable (true) or disable (false) the verification mark
 * @returns {Promise<void>}
 */
async function setBluemark(userId, status) {
  try {
    // Get a reference to the user document
    const userRef = admin.firestore().collection('users').doc(userId);
    
    // Update the bluemark field
    await userRef.update({
      bluemark: status
    });
    
    console.log(`Verification mark status for user ${userId} set to ${status}`);
  } catch (error) {
    console.error(`Error updating verification mark status: ${error}`);
    throw error;
  }
}

// Example usage
// setBluemark('user123', true)  // Enable verification mark
// setBluemark('user456', false) // Disable verification mark

module.exports = { setBluemark }; 