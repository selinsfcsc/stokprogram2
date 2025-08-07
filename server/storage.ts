import { 
  type Product, 
  type InsertProduct, 
  type Customer, 
  type InsertCustomer, 
  type Sale, 
  type InsertSale,
  type StockMovement,
  type InsertStockMovement,
  type SerialNumber,
  type InsertSerialNumber,
  type Return,
  type InsertReturn,
  type User,
  type InsertUser,
  type CsvImportLog,
  type InsertCsvImportLog,
  type ProductLabel,
  type InsertProductLabel
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByStockCode(stockCode: string): Promise<Product | undefined>;
  getProductBySerialNumber(serialNumber: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getLowStockProducts(): Promise<Product[]>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  getSalesByProduct(productId: string): Promise<Sale[]>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  getTodaySales(): Promise<Sale[]>;
  getSalesStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    todaySales: number;
    activeCustomers: number;
  }>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Serial Numbers
  getSerialNumbers(): Promise<SerialNumber[]>;
  getSerialNumbersByProduct(productId: string): Promise<SerialNumber[]>;
  getSerialNumber(serialNumber: string): Promise<SerialNumber | undefined>;
  createSerialNumber(serialNumber: InsertSerialNumber): Promise<SerialNumber>;
  updateSerialNumber(id: string, updates: Partial<InsertSerialNumber>): Promise<SerialNumber | undefined>;

  // Returns
  getReturns(): Promise<Return[]>;
  getReturn(id: string): Promise<Return | undefined>;
  getReturnsByCustomer(customerId: string): Promise<Return[]>;
  createReturn(returnItem: InsertReturn): Promise<Return>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private customers: Map<string, Customer>;
  private sales: Map<string, Sale>;
  private stockMovements: Map<string, StockMovement>;
  private serialNumbers: Map<string, SerialNumber>;
  private returns: Map<string, Return>;

  constructor() {
    this.products = new Map();
    this.customers = new Map();
    this.sales = new Map();
    this.stockMovements = new Map();
    this.serialNumbers = new Map();
    this.returns = new Map();
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByStockCode(stockCode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.stockCode === stockCode
    );
  }

  async getProductBySerialNumber(serialNumber: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.serialNumber === serialNumber
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      id,
      qrCode: `QR-${id}`,
      createdAt: now,
      updatedAt: now,
      quantity: insertProduct.quantity ?? 0,
      serialNumber: insertProduct.serialNumber ?? null,
      productLink: insertProduct.productLink ?? null,
      description: insertProduct.description ?? null,
      lowStockThreshold: insertProduct.lowStockThreshold ?? null,
    };
    this.products.set(id, product);
    
    // Create initial stock movement
    if (product.quantity > 0) {
      await this.createStockMovement({
        productId: id,
        type: 'in',
        quantity: product.quantity,
        reason: 'İlk stok girişi',
        userId: 'system'
      });
    }

    // Generate serial numbers for products with quantity > 1
    if (product.quantity > 1) {
      for (let i = 1; i <= product.quantity; i++) {
        await this.createSerialNumber({
          productId: id,
          serialNumber: `${product.stockCode}-${String(i).padStart(3, '0')}`,
          status: 'available'
        });
      }
    }
    
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.quantity <= (product.lowStockThreshold || 5)
    );
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
      companyName: insertCustomer.companyName ?? null,
      email: insertCustomer.email ?? null,
      phone: insertCustomer.phone ?? null,
      address: insertCustomer.address ?? null,
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer: Customer = {
      ...customer,
      ...updates,
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values()).sort((a, b) => 
      new Date(b.saleDate!).getTime() - new Date(a.saleDate!).getTime()
    );
  }

  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSalesByProduct(productId: string): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => sale.productId === productId);
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => sale.customerId === customerId);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = randomUUID();
    const sale: Sale = {
      ...insertSale,
      id,
      saleDate: new Date(),
      customerId: insertSale.customerId ?? null,
      notes: insertSale.notes ?? null,
    };
    this.sales.set(id, sale);

    // Update product quantity
    const product = this.products.get(insertSale.productId);
    if (product) {
      product.quantity -= insertSale.quantitySold;
      product.updatedAt = new Date();
      this.products.set(product.id, product);
      
      // Create stock movement for sale
      await this.createStockMovement({
        productId: insertSale.productId,
        type: 'sale',
        quantity: insertSale.quantitySold,
        reason: `Satış - Müşteri: ${insertSale.customerId}`,
        userId: 'system'
      });
    }

    return sale;
  }

  async getTodaySales(): Promise<Sale[]> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.sales.values()).filter(
      sale => sale.saleDate?.toISOString().startsWith(today)
    );
  }

  // Stock Movements Implementation
  async getStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values())
      .filter(movement => movement.productId === productId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const id = randomUUID();
    const movement: StockMovement = {
      ...insertMovement,
      id,
      createdAt: new Date(),
      reason: insertMovement.reason ?? null,
      userId: insertMovement.userId ?? null,
    };
    this.stockMovements.set(id, movement);
    return movement;
  }

  // Serial Numbers Implementation
  async getSerialNumbers(): Promise<SerialNumber[]> {
    return Array.from(this.serialNumbers.values());
  }

  async getSerialNumbersByProduct(productId: string): Promise<SerialNumber[]> {
    return Array.from(this.serialNumbers.values()).filter(
      serial => serial.productId === productId
    );
  }

  async getSerialNumber(serialNumber: string): Promise<SerialNumber | undefined> {
    return Array.from(this.serialNumbers.values()).find(
      serial => serial.serialNumber === serialNumber
    );
  }

  async createSerialNumber(insertSerial: InsertSerialNumber): Promise<SerialNumber> {
    const id = randomUUID();
    const serial: SerialNumber = {
      ...insertSerial,
      id,
      createdAt: new Date(),
      status: insertSerial.status ?? null,
      saleId: insertSerial.saleId ?? null,
    };
    this.serialNumbers.set(id, serial);
    return serial;
  }

  async updateSerialNumber(id: string, updates: Partial<InsertSerialNumber>): Promise<SerialNumber | undefined> {
    const serial = this.serialNumbers.get(id);
    if (!serial) return undefined;

    const updatedSerial: SerialNumber = {
      ...serial,
      ...updates,
    };
    this.serialNumbers.set(id, updatedSerial);
    return updatedSerial;
  }

  // Returns Implementation  
  async getReturns(): Promise<Return[]> {
    return Array.from(this.returns.values()).sort(
      (a, b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime()
    );
  }

  async getReturn(id: string): Promise<Return | undefined> {
    return this.returns.get(id);
  }

  async getReturnsByCustomer(customerId: string): Promise<Return[]> {
    return Array.from(this.returns.values()).filter(
      returnItem => returnItem.customerId === customerId
    );
  }

  async createReturn(insertReturn: InsertReturn): Promise<Return> {
    const id = randomUUID();
    const returnItem: Return = {
      ...insertReturn,
      id,
      returnDate: new Date(),
      serialNumber: insertReturn.serialNumber ?? null,
      notes: insertReturn.notes ?? null,
      status: insertReturn.status ?? null,
      resolutionDate: insertReturn.resolutionDate ?? null,
    };
    this.returns.set(id, returnItem);
    return returnItem;
  }

  async getSalesStats(): Promise<{
    totalProducts: number;
    lowStock: number;
    todaySales: number;
    activeCustomers: number;
  }> {
    const totalProducts = this.products.size;
    const lowStockProducts = await this.getLowStockProducts();
    const todaySales = await this.getTodaySales();
    const todaySalesAmount = todaySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    
    return {
      totalProducts,
      lowStock: lowStockProducts.length,
      todaySales: todaySalesAmount,
      activeCustomers: this.customers.size,
    };
  }
}

export const storage = new MemStorage();
