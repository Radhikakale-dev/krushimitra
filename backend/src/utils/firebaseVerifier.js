import https from 'https';
import jwt from 'jsonwebtoken';

let cachedKeys = null;
let keysExpiryTime = 0;

/**
 * Fetches Google's public certificates used to sign Firebase ID tokens.
 * Caches certificates according to their Cache-Control headers.
 */
const fetchGooglePublicKeys = () => {
  return new Promise((resolve, reject) => {
    // Return cached keys if valid and not expired
    if (cachedKeys && Date.now() < keysExpiryTime) {
      return resolve(cachedKeys);
    }

    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const keys = JSON.parse(data);
          
          // Parse max-age from Cache-Control headers
          const cacheControl = res.headers['cache-control'] || '';
          const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
          const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600000;
          
          cachedKeys = keys;
          keysExpiryTime = Date.now() + maxAge;
          resolve(keys);
        } catch (err) {
          reject(new Error('Failed to parse Google public keys: ' + err.message));
        }
      });
    }).on('error', (err) => {
      reject(new Error('Failed to fetch Google public keys: ' + err.message));
    });
  });
};

/**
 * Verifies a Firebase ID token signature and claims.
 * Extracted projectId from environment or token issuer fallback.
 */
export const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new Error('Invalid token format');
    }

    const payload = decodedToken.payload;
    if (!payload || !payload.iss || !payload.iss.startsWith('https://securetoken.google.com/')) {
      throw new Error('Issuer claim is invalid. Not a Firebase token.');
    }

    // Identify target project ID
    const tokenProjectId = payload.iss.split('/').pop();
    const configProjectId = process.env.FIREBASE_PROJECT_ID;

    // In production, enforce matching project ID from configuration
    if (configProjectId && tokenProjectId !== configProjectId) {
      throw new Error(`Project ID mismatch. Expected: ${configProjectId}, Got: ${tokenProjectId}`);
    }

    // Fetch active public certificates
    const keys = await fetchGooglePublicKeys();
    const cert = keys[decodedToken.header.kid];
    if (!cert) {
      throw new Error(`Public certificate not found for key ID: ${decodedToken.header.kid}`);
    }

    // Verify token cryptographically
    const verified = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: configProjectId || tokenProjectId,
      issuer: `https://securetoken.google.com/${configProjectId || tokenProjectId}`,
    });

    return verified;
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    throw error;
  }
};
