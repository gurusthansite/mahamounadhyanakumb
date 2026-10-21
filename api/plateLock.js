import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Persistence file location (uses /tmp on serverless or local OS temp)
const LOCKS_FILE = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'annaprasadam_plate_locks.json'
);

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes hold for pending payments

function readLocks() {
  try {
    if (fs.existsSync(LOCKS_FILE)) {
      const data = fs.readFileSync(LOCKS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read locks file, using in-memory store:', err.message);
  }
  return {};
}

function writeLocks(locks) {
  try {
    fs.writeFileSync(LOCKS_FILE, JSON.stringify(locks, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write locks file:', err.message);
  }
}

/**
 * Clean up expired pending locks
 */
function cleanExpired(locks) {
  const now = Date.now();
  let modified = false;
  for (const [plateKey, record] of Object.entries(locks)) {
    if (record.status === 'PENDING' && record.expiresAt && record.expiresAt < now) {
      delete locks[plateKey];
      modified = true;
    }
  }
  if (modified) writeLocks(locks);
  return locks;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, plateNumber, lockToken, donorName, phoneNumber, plates, amount, paymentId, orderId } = req.body || req.query || {};

  let locks = cleanExpired(readLocks());

  // 1. GET STATUS of a Plate Number or NEXT AVAILABLE
  if (req.method === 'GET' || action === 'status') {
    const targetPlate = (plateNumber || '').toString().trim().toUpperCase();

    if (!targetPlate) {
      // Find the next available plate number (starting from PL-001)
      let candidateNum = 1;
      while (locks[`PL-${String(candidateNum).padStart(3, '0')}`]) {
        const item = locks[`PL-${String(candidateNum).padStart(3, '0')}`];
        if (item.status === 'LOCKED' || (item.status === 'PENDING' && item.expiresAt > Date.now())) {
          candidateNum++;
        } else {
          break;
        }
      }
      const nextPlate = `PL-${String(candidateNum).padStart(3, '0')}`;
      return res.status(200).json({
        success: true,
        nextSuggestedPlate: nextPlate,
        available: true
      });
    }

    const existing = locks[targetPlate];
    if (!existing) {
      return res.status(200).json({
        success: true,
        plateNumber: targetPlate,
        status: 'AVAILABLE',
        available: true
      });
    }

    if (existing.status === 'LOCKED') {
      return res.status(200).json({
        success: true,
        plateNumber: targetPlate,
        status: 'LOCKED',
        available: false,
        isPermanent: true,
        lockedAt: existing.lockedAt
      });
    }

    if (existing.status === 'PENDING' && existing.expiresAt > Date.now()) {
      return res.status(200).json({
        success: true,
        plateNumber: targetPlate,
        status: 'PENDING',
        available: false,
        expiresInSeconds: Math.round((existing.expiresAt - Date.now()) / 1000)
      });
    }

    return res.status(200).json({
      success: true,
      plateNumber: targetPlate,
      status: 'AVAILABLE',
      available: true
    });
  }

  // 2. ACQUIRE PENDING LOCK (Before Payment)
  if (action === 'lock') {
    if (!plateNumber) {
      return res.status(400).json({ success: false, error: 'Plate number is required' });
    }

    const cleanPlate = plateNumber.toString().trim().toUpperCase();
    const existing = locks[cleanPlate];

    // Check if permanently locked
    if (existing && existing.status === 'LOCKED') {
      return res.status(409).json({
        success: false,
        error: `ప్లేట్ నంబర్ ${cleanPlate} ఇప్పటికే శాశ్వతంగా రిజిస్టర్ చేయబడింది (Plate number is already permanently locked)`,
        isPermanent: true
      });
    }

    // Check if pending lock active by someone else
    if (existing && existing.status === 'PENDING' && existing.expiresAt > Date.now()) {
      if (existing.lockToken !== lockToken) {
        return res.status(423).json({
          success: false,
          error: `ప్లేట్ నంబర్ ${cleanPlate} ప్రస్తుతం మరొక పేమెంట్ ప్రాసెస్‌లో రిజర్వ్ చేయబడింది. దయచేసి వేరొక నంబర్ ఎంచుకోండి లేదా 15 నిమిషాల తర్వాత ప్రయత్నించండి. (Plate is currently reserved for a pending transaction)`,
          expiresInSeconds: Math.round((existing.expiresAt - Date.now()) / 1000)
        });
      }
    }

    // Acquire or renew pending lock
    const newLockToken = lockToken || crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + LOCK_DURATION_MS;

    locks[cleanPlate] = {
      plateNumber: cleanPlate,
      status: 'PENDING',
      lockToken: newLockToken,
      donorName: donorName || '',
      phoneNumber: phoneNumber || '',
      plates: plates || 1,
      amount: amount || 1,
      lockedAt: new Date(now).toISOString(),
      expiresAt: expiresAt
    };

    writeLocks(locks);

    return res.status(200).json({
      success: true,
      plateNumber: cleanPlate,
      lockToken: newLockToken,
      expiresAt: expiresAt,
      expiresInSeconds: Math.round(LOCK_DURATION_MS / 1000),
      message: 'Plate number reserved successfully for payment'
    });
  }

  // 3. VERIFY AND PERMANENTLY LOCK
  if (action === 'verifyAndLock') {
    if (!plateNumber) {
      return res.status(400).json({ success: false, error: 'Plate number is required' });
    }
    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'Payment ID is required to permanently lock' });
    }

    const cleanPlate = plateNumber.toString().trim().toUpperCase();
    const existing = locks[cleanPlate];

    // If already permanently locked with THIS paymentId, it's already verified (idempotent)
    if (existing && existing.status === 'LOCKED' && existing.paymentId === paymentId) {
      return res.status(200).json({
        success: true,
        plateNumber: cleanPlate,
        status: 'LOCKED',
        isPermanent: true,
        message: 'Plate already locked for this payment'
      });
    }

    // If locked with a DIFFERENT payment ID, prevent duplicate assignment!
    if (existing && existing.status === 'LOCKED' && existing.paymentId !== paymentId) {
      return res.status(409).json({
        success: false,
        error: `ఈ ప్లేట్ నంబర్ ${cleanPlate} ఇప్పటికే మరొక చెల్లింపుకు కేటాయించబడింది. నకిలీ కేటాయింపు నిరోధించబడింది. (Duplicate assignment prevented)`,
        isPermanent: true
      });
    }

    // Permanently lock the plate
    locks[cleanPlate] = {
      plateNumber: cleanPlate,
      status: 'LOCKED',
      isPermanent: true,
      paymentId: paymentId,
      orderId: orderId || '',
      donorName: donorName || existing?.donorName || '',
      phoneNumber: phoneNumber || existing?.phoneNumber || '',
      plates: plates || existing?.plates || 1,
      amount: amount || existing?.amount || 1,
      lockedAt: new Date().toISOString()
    };

    writeLocks(locks);

    return res.status(200).json({
      success: true,
      plateNumber: cleanPlate,
      status: 'LOCKED',
      isPermanent: true,
      paymentId: paymentId,
      message: 'Plate number permanently locked upon verified payment'
    });
  }

  // 4. RELEASE PENDING LOCK (On cancel / fail)
  if (action === 'release') {
    if (!plateNumber) {
      return res.status(400).json({ success: false, error: 'Plate number is required' });
    }

    const cleanPlate = plateNumber.toString().trim().toUpperCase();
    const existing = locks[cleanPlate];

    if (existing && existing.status === 'PENDING') {
      if (!lockToken || existing.lockToken === lockToken) {
        delete locks[cleanPlate];
        writeLocks(locks);
        return res.status(200).json({
          success: true,
          plateNumber: cleanPlate,
          released: true,
          message: 'Pending lock safely released'
        });
      }
    }

    return res.status(200).json({
      success: true,
      plateNumber: cleanPlate,
      released: false,
      message: existing?.status === 'LOCKED' ? 'Cannot release permanently locked plate' : 'Lock not found or expired'
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid action' });
}
