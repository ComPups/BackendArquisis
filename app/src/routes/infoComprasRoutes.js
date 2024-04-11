const express = require('express');
const ComprasController = require('../controllers/comprasController');

const router = express.Router();

router.post('/flights/:id', ComprasController.createInfoCompras);

router.get('/flights/:id/validations', ComprasController.manejarValidation);


module.exports = router;
