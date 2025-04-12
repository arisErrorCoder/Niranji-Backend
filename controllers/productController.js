const Product = require("../models/Product");
const multer = require("multer");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save images in "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Initialize upload middleware (max 3 images)
const upload = multer({ storage }).array("images", 3);

// Add a new product with images
exports.addProduct = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ message: "Image upload failed", err });

      const imagePaths = req.files.map(file => file.filename); // Extract filenames correctly

      // Parse pricePerSize, nutrients, and benefits if they are strings
      let { pricePerSize, tags,nutrients, description, benefits,howtouse,storageInfo } = req.body;

      try {
        if (typeof pricePerSize === "string") {
          pricePerSize = JSON.parse(pricePerSize);
        }
        if (typeof nutrients === "string") {
          nutrients = JSON.parse(nutrients);
        }
        if (typeof benefits === "string") {
          benefits = JSON.parse(benefits);
        }
        if (typeof tags === "string") {
          tags = JSON.parse(tags);
        }
        if (typeof storageInfo === "string") {
          storageInfo = JSON.parse(storageInfo);
        }
        if (typeof description === "string") {
          description = JSON.parse(description);
        }
        if (typeof howtouse === "string") {
          howtouse = JSON.parse(howtouse);
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid JSON format in request body", error });
      }

      const product = new Product({
        ...req.body,
        pricePerSize,
        tags,  // Save parsed pricePerSize
        nutrients,     // Save parsed nutrients
        benefits,
        description,
        howtouse,
        storageInfo,      // Save parsed benefits
        images: imagePaths // Save image paths
      });

      await product.save();
      res.status(201).json({ message: "Product added successfully", product });
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding product", error });
  }
};



// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};
