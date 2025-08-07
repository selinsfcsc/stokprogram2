import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productName: text("product_name").notNull(),
  stockCode: text("stock_code").notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
  serialNumber: text("serial_number"),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  productLink: text("product_link"),
  description: text("description"),
  qrCode: text("qr_code"),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  customerId: varchar("customer_id").references(() => customers.id),
  quantitySold: integer("quantity_sold").notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").defaultNow(),
  notes: text("notes"),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  saleDate: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export interface StatsResponse {
  totalProducts: number;
  lowStock: number;
  todaySales: number;
  activeCustomers: number;
}

// Stock Movement Log Table
export const stockMovements = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  type: text("type", { enum: ["in", "out", "sale", "adjustment"] }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  userId: text("user_id"), // For future user management
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

// Serial Numbers Table for per-unit tracking
export const serialNumbers = pgTable("serial_numbers", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  serialNumber: text("serial_number").notNull().unique(),
  status: text("status", { enum: ["available", "sold", "returned", "defective"] }).default("available"),
  saleId: text("sale_id").references(() => sales.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSerialNumberSchema = createInsertSchema(serialNumbers).omit({
  id: true,
  createdAt: true,
});

export type SerialNumber = typeof serialNumbers.$inferSelect;
export type InsertSerialNumber = z.infer<typeof insertSerialNumberSchema>;

// Returns and Warranty Table
export const returns = pgTable("returns", {
  id: text("id").primaryKey(),
  saleId: text("sale_id").notNull().references(() => sales.id),
  productId: text("product_id").notNull().references(() => products.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  serialNumber: text("serial_number"),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "resolved"] }).default("pending"),
  returnDate: timestamp("return_date").defaultNow(),
  resolutionDate: timestamp("resolution_date"),
  notes: text("notes"),
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  returnDate: true,
});

export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;

// Users table for authentication and role management
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "sales", "warehouse", "viewer"] }).notNull().default("viewer"),
  fullName: text("full_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Task Assignment System
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to").notNull(),
  assignedBy: text("assigned_by").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  priority: text("priority", { enum: ["normal", "high"] }).default("normal"),
  status: text("status", { enum: ["pending", "completed"] }).default("pending"),
  completionNote: text("completion_note"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Feedback System
export const feedbacks = pgTable("feedbacks", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  sender: text("sender").notNull(),
  relatedTaskId: text("related_task_id").references(() => tasks.id),
  status: text("status", { enum: ["info", "problem", "suggestion"] }).notNull(),
  adminResponse: text("admin_response"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Anonymous Complaints System
export const complaints = pgTable("complaints", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

// Notification System
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["task", "feedback_response", "system"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: text("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// CSV Import Logs for bulk product uploads
export const csvImportLogs = pgTable("csv_import_logs", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  totalRows: integer("total_rows").notNull(),
  successRows: integer("success_rows").notNull(),
  failedRows: integer("failed_rows").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull(),
  errorDetails: text("error_details"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Product Labels for printing
export const productLabels = pgTable("product_labels", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  labelFormat: text("label_format").notNull().default("58x40"),
  labelData: text("label_data").notNull(), // JSON with label content
  printCount: integer("print_count").notNull().default(0),
  lastPrintedAt: timestamp("last_printed_at"),
  createdAt: timestamp("created_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCsvImportLogSchema = createInsertSchema(csvImportLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProductLabelSchema = createInsertSchema(productLabels).omit({
  id: true,
  createdAt: true,
});

// Additional types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CsvImportLog = typeof csvImportLogs.$inferSelect;
export type InsertCsvImportLog = z.infer<typeof insertCsvImportLogSchema>;

export type ProductLabel = typeof productLabels.$inferSelect;
export type InsertProductLabel = z.infer<typeof insertProductLabelSchema>;
