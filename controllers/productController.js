
const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res, next) => {
  try {
    // Query parameters for filtering
    const {
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      isActive,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by stock range
    if (minStock || maxStock) {
      query.stock = {};
      if (minStock) query.stock.$gte = Number(minStock);
      if (maxStock) query.stock.$lte = Number(maxStock);
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name, SKU, or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOption = {};
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach((field) => {
        if (field.startsWith('-')) {
          sortOption[field.substring(1)] = -1; // Descending
        } else {
          sortOption[field] = 1; // Ascending
        }
      });
    } else {
      sortOption = { createdAt: -1 }; // Default: newest first
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Product.countDocuments(query);

    // Calculate statistics
    const stats = {
      totalProducts: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      productsPerPage: limitNum,
    };

    res.status(200).json({
      success: true,
      count: products.length,
      stats,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Staff)
exports.createProduct = async (req, res, next) => {
  try {
    // Add user who created the product
    req.body.createdBy = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Staff)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Add user who updated the product
    req.body.updatedBy = req.user.id;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
Lanjutkan

javascript
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    })
      .populate('createdBy', 'name email')
      .sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Private
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const products = await Product.find({
      category: category,
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/products/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Low stock products
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    });

    // Total stock value
    const stockValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } },
        },
      },
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Recent products (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalStockValue: stockValue[0]?.totalValue || 0,
        recentProducts,
        productsByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock quantity
// @route   PATCH /api/products/:id/stock
// @access  Private (Admin, Staff)
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (operation === 'add') {
      product.stock += quantity;
    } else if (operation === 'subtract') {
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        });
      }
      product.stock -= quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"',
      });
    }

    product.updatedBy = req.user.id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
