import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertCustomerSchema, 
  insertSaleSchema,
  insertStockMovementSchema,
  insertSerialNumberSchema,
  insertReturnSchema
} from "@shared/schema";
import QRCode from "qrcode";

export async function registerRoutes(app: Express): Promise<Server> {
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Ürünler alınırken hata oluştu" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Ürün alınırken hata oluştu" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // Check if stock code already exists
      const existingProduct = await storage.getProductByStockCode(validatedData.stockCode);
      if (existingProduct) {
        return res.status(400).json({ message: "Bu stok kodu zaten kullanılıyor" });
      }

      const product = await storage.createProduct(validatedData);
      
      // Generate QR code
      const qrCodeData = JSON.stringify({
        id: product.id,
        stockCode: product.stockCode,
        productName: product.productName,
        serialNumber: product.serialNumber
      });
      
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
      
      // Update product with QR code
      await storage.updateProduct(product.id, { qrCode: qrCodeUrl });
      
      const updatedProduct = await storage.getProduct(product.id);
      res.status(201).json(updatedProduct);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Ürün oluşturulurken hata oluştu" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Ürün güncellenirken hata oluştu" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      res.json({ message: "Ürün silindi" });
    } catch (error) {
      res.status(500).json({ message: "Ürün silinirken hata oluştu" });
    }
  });

  // Search products
  app.get("/api/products/search/:query", async (req, res) => {
    try {
      const query = req.params.query.toLowerCase();
      const products = await storage.getProducts();
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(query) ||
        product.stockCode.toLowerCase().includes(query) ||
        (product.serialNumber && product.serialNumber.toLowerCase().includes(query))
      );
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Arama sırasında hata oluştu" });
    }
  });

  // Low stock products
  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ message: "Düşük stok ürünleri alınırken hata oluştu" });
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Müşteriler alınırken hata oluştu" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Müşteri oluşturulurken hata oluştu" });
      }
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Satışlar alınırken hata oluştu" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      
      // Check if product exists and has enough stock
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      
      if (product.quantity < validatedData.quantitySold) {
        return res.status(400).json({ message: "Yetersiz stok" });
      }
      
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Satış oluşturulurken hata oluştu" });
      }
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getSalesStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "İstatistikler alınırken hata oluştu" });
    }
  });

  // QR Code generation
  app.get("/api/qr/:productId", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }

      const qrCodeData = JSON.stringify({
        id: product.id,
        stockCode: product.stockCode,
        productName: product.productName,
        serialNumber: product.serialNumber
      });
      
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
      res.json({ qrCode: qrCodeUrl });
    } catch (error) {
      res.status(500).json({ message: "QR kod oluşturulurken hata oluştu" });
    }
  });

  // Stock Movements routes
  app.get("/api/stock-movements", async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Stok hareketleri alınırken hata oluştu" });
    }
  });

  app.get("/api/stock-movements/product/:productId", async (req, res) => {
    try {
      const movements = await storage.getStockMovementsByProduct(req.params.productId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Ürün stok hareketleri alınırken hata oluştu" });
    }
  });

  app.post("/api/stock-movements", async (req, res) => {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      const movement = await storage.createStockMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: "Stok hareketi kaydedilirken hata oluştu" });
    }
  });

  // Serial Numbers routes
  app.get("/api/serial-numbers", async (req, res) => {
    try {
      const serialNumbers = await storage.getSerialNumbers();
      res.json(serialNumbers);
    } catch (error) {
      res.status(500).json({ message: "Seri numaraları alınırken hata oluştu" });
    }
  });

  app.get("/api/serial-numbers/product/:productId", async (req, res) => {
    try {
      const serialNumbers = await storage.getSerialNumbersByProduct(req.params.productId);
      res.json(serialNumbers);
    } catch (error) {
      res.status(500).json({ message: "Ürün seri numaraları alınırken hata oluştu" });
    }
  });

  app.get("/api/serial-numbers/:serialNumber", async (req, res) => {
    try {
      const serial = await storage.getSerialNumber(req.params.serialNumber);
      if (!serial) {
        return res.status(404).json({ message: "Seri numarası bulunamadı" });
      }
      res.json(serial);
    } catch (error) {
      res.status(500).json({ message: "Seri numarası alınırken hata oluştu" });
    }
  });

  app.post("/api/serial-numbers", async (req, res) => {
    try {
      const validatedData = insertSerialNumberSchema.parse(req.body);
      const serial = await storage.createSerialNumber(validatedData);
      res.status(201).json(serial);
    } catch (error) {
      res.status(400).json({ message: "Seri numarası kaydedilirken hata oluştu" });
    }
  });

  // Returns routes
  app.get("/api/returns", async (req, res) => {
    try {
      const returns = await storage.getReturns();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ message: "İadeler alınırken hata oluştu" });
    }
  });

  app.get("/api/returns/:id", async (req, res) => {
    try {
      const returnItem = await storage.getReturn(req.params.id);
      if (!returnItem) {
        return res.status(404).json({ message: "İade bulunamadı" });
      }
      res.json(returnItem);
    } catch (error) {
      res.status(500).json({ message: "İade alınırken hata oluştu" });
    }
  });

  app.get("/api/returns/customer/:customerId", async (req, res) => {
    try {
      const returns = await storage.getReturnsByCustomer(req.params.customerId);
      res.json(returns);
    } catch (error) {
      res.status(500).json({ message: "Müşteri iadeleri alınırken hata oluştu" });
    }
  });

  app.post("/api/returns", async (req, res) => {
    try {
      const validatedData = insertReturnSchema.parse(req.body);
      const returnItem = await storage.createReturn(validatedData);
      res.status(201).json(returnItem);
    } catch (error) {
      res.status(400).json({ message: "İade kaydedilirken hata oluştu" });
    }
  });

  // Task Management
  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = req.body;
      const task = {
        id: crypto.randomUUID(),
        ...taskData,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Görev oluşturulamadı" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Görevler alınamadı" });
    }
  });

  app.get("/api/tasks/my", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Kullanıcı görevleri alınamadı" });
    }
  });

  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const updates = req.body;
      const task = {
        id: req.params.id,
        ...updates,
        completedAt: new Date().toISOString()
      };
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Görev tamamlanamadı" });
    }
  });

  // Feedback Management
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = req.body;
      const feedback = {
        id: crypto.randomUUID(),
        ...feedbackData,
        createdAt: new Date().toISOString(),
        respondedAt: null
      };
      res.json(feedback);
    } catch (error) {
      res.status(400).json({ message: "Geri bildirim oluşturulamadı" });
    }
  });

  app.get("/api/feedback/my", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Kullanıcı geri bildirimleri alınamadı" });
    }
  });

  // Anonymous Complaints
  app.post("/api/complaints", async (req, res) => {
    try {
      const complaintData = req.body;
      const complaint = {
        id: crypto.randomUUID(),
        ...complaintData,
        createdAt: new Date().toISOString()
      };
      res.json(complaint);
    } catch (error) {
      res.status(400).json({ message: "Şikayet oluşturulamadı" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Bildirimler alınamadı" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = {
        id: req.params.id,
        isRead: true
      };
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: "Bildirim okundu olarak işaretlenemedi" });
    }
  });

  // Delivery Labels PDF Generation
  app.post("/api/delivery-labels/generate", async (req, res) => {
    try {
      const { labels, senderCompany, receiverCompany } = req.body;
      
      const csvContent = labels.map((label: any) => 
        `${label.orderNumber},${senderCompany},${receiverCompany}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=delivery-labels.csv');
      res.send(`Ürün,Gönderen,Alıcı\n${csvContent}`);
    } catch (error) {
      res.status(500).json({ message: "Teslimat etiketleri oluşturulamadı" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
