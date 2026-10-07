const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all E-Governance requests
router.get('/', auth(), async (req, res, next) => {
  try {
    let requests = await store.get('complaints');
    
    // Filter only E-Governance document requests
    requests = requests.filter((r) => r.type && r.type.startsWith('egov_'));

    // If citizen, restrict to their own requests
    if (req.user.role === 'citizen') {
      requests = requests.filter((r) => r.userId === req.user.id);
    }

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Create E-Governance request
router.post('/', auth(), async (req, res, next) => {
  const { type, title, description, location } = req.body;
  if (!type || !title || !description) {
    return res.status(400).json({ error: 'Type, title, and description are required' });
  }

  if (!type.startsWith('egov_')) {
    return res.status(400).json({ error: 'Invalid E-Governance type' });
  }

  const documentRequest = {
    id: uuidv4(),
    userId: req.user.id,
    type,
    title,
    description,
    location: location || 'N/A',
    status: 'pending',
    assignedTo: 'E-Governance Department',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const created = await store.add('complaints', documentRequest);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Update E-Governance request status (Admin only)
router.patch('/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status parameter' });
  }

  try {
    // Verify it is an E-Governance request first
    const request = await store.find('complaints', req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (!request.type || !request.type.startsWith('egov_')) {
      return res.status(400).json({ error: 'Access denied: not an E-Governance request' });
    }

    const updated = await store.update('complaints', req.params.id, {
      status,
      updatedAt: new Date().toISOString()
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Send Birth Certificate via Email (Admin only)
router.post('/:id/send-email', auth(), requireRole('admin'), async (req, res, next) => {
  const { dateOfBirth, placeOfBirth, parentsNames, certificateNo } = req.body;
  if (!dateOfBirth || !placeOfBirth || !parentsNames || !certificateNo) {
    return res.status(400).json({ error: 'All certificate details are required' });
  }

  try {
    const documentRequest = await store.find('complaints', req.params.id);
    if (!documentRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (documentRequest.type !== 'egov_birth_cert') {
      return res.status(400).json({ error: 'Email delivery is only supported for Birth Certificates' });
    }

    // Get citizen user details to find email
    const citizen = await store.find('users', documentRequest.userId);
    if (!citizen || !citizen.email) {
      return res.status(400).json({ error: 'User email not found' });
    }

    // Format a system log entries string to append to description
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const systemLog = `\n\n[System Log] Birth Certificate (Cert No: ${certificateNo}) emailed successfully to ${citizen.email} on ${timestamp}.\n- Date of Birth: ${dateOfBirth}\n- Place of Birth: ${placeOfBirth}\n- Parents: ${parentsNames}`;

    const updated = await store.update('complaints', req.params.id, {
      description: documentRequest.description + systemLog,
      status: 'approved',
      updatedAt: new Date().toISOString()
    });

    console.log(`=========================================`);
    console.log(`SIMULATED EMAIL DISPATCH:`);
    console.log(`To: ${citizen.email}`);
    console.log(`Subject: Official Birth Certificate Issued - ID: ${documentRequest.id}`);
    console.log(`Body:`);
    console.log(`Hello ${citizen.name},`);
    console.log(`We are pleased to inform you that your Birth Certificate application has been approved and issued.`);
    console.log(`Certificate Details:`);
    console.log(`- Certificate No: ${certificateNo}`);
    console.log(`- Date of Birth: ${dateOfBirth}`);
    console.log(`- Place of Birth: ${placeOfBirth}`);
    console.log(`- Parents: ${parentsNames}`);
    console.log(`Sincerely,`);
    console.log(`E-Governance Department, Smart City Management`);
    console.log(`=========================================`);

    res.json({ success: true, request: updated, email: citizen.email });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
