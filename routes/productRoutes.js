const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/add", productController.addProduct);
router.delete("/delete/:id", productController.deleteProduct);
router.get("/", productController.getProducts);
router.put('/edit/:id', productController.editProduct);

module.exports = router;
