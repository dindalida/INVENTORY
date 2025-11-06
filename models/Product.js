
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'Clothing',
        'Food & Beverage',
        'Furniture',
        'Stationery',
        'Hardware',
        'Other',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    minStock: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['pcs', 'box', 'kg', 'liter', 'meter', 'set'],
      default: 'pcs',
    },
    supplier: {
      name: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);
// Index untuk search yang lebih cepat
productSchema.index({ name: 'text', sku: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

// Virtual untuk menghitung profit margin
productSchema.virtual('profitMargin').get(function () {
  if (this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost) * 100;
});

// Virtual untuk check low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStock;
});

// Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);