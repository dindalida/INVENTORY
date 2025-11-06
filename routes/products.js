const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductsByCategory,
  getDashboardStats,
  updateStock,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3-100 characters'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('SKU must be between 3-20 characters'),
  body('category')
    .isIn([
      'Electronics',
      'Clothing',
      'Food & Beverage',
      'Furniture',
      'Stationery',
      'Hardware',
      'Other',
    ])
    .withMessage('Invalid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('unit')
    .isIn(['pcs', 'box', 'kg', 'liter', 'meter', 'set'])
    .withMessage('Invalid unit'),
];

const updateStockValidation = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('operation')
    .isIn(['add', 'subtract'])
    .withMessage('Operation must be either "add" or "subtract"'),
];

// Special routes (must be before /:id routes)
router.get('/low-stock', protect, getLowStockProducts);
router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/category/:category', protect, getProductsByCategory);

// Standard CRUD routes
router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorize('admin', 'staff'), productValidation, validate, createProduct);

router
  .route('/:id')
  .get(protect, getProduct)
  .put(protect, authorize('admin', 'staff'), productValidation, validate, updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

router
  .route('/:id/stock')
  .patch(protect, authorize('admin', 'staff'), updateStockValidation, validate, updateStock);

module.exports = router;