const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('donor'), listingController.createListing);
router.post('/collect', protect, authorize('organization'), listingController.collectListings);
router.post('/:id/claim', protect, authorize('consumer', 'donor'), listingController.claimListing);
router.get('/clusters', listingController.getClusters); // Public for now/or protected
router.get('/', listingController.getListings);

module.exports = router;
