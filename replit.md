# Overview

This is a comprehensive Turkish-language stock management system built as a full-stack web application. The system provides enterprise-level inventory management capabilities including product tracking, sales management, customer relationship management, QR code integration, stock movement auditing, detailed reporting, and serial number tracking. It features a modern React-based frontend with a Node.js/Express backend, using PostgreSQL for data persistence through Drizzle ORM.

## Recent Updates (January 7, 2025)
- **Task Management System**: Complete task assignment workflow with admin to user task delegation
- **Feedback System**: Structured feedback collection from users to administrators with response tracking
- **Anonymous Complaint System**: Secure anonymous reporting system for workplace issues
- **Delivery Label Generation**: Batch shipment label system with PDF export functionality
- **User Management Panel**: Admin interface for role management and user administration
- **Task Overview Dashboard**: Comprehensive task tracking and reporting for administrators
- **Real-Time Notification System**: Bell notification system for task assignments and feedback responses
- **Enhanced Navigation**: Updated sidebar with all new task management and administration features
- **Role-Based Permissions**: Extended permission system to support new task and admin features
- **Complete Turkish Interface**: All new features fully localized in Turkish language

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod schema validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Data Layer**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful APIs with structured error handling
- **Storage**: In-memory storage implementation with interface for future database migration

## Database Schema
- **Products Table**: Core inventory items with stock codes, quantities, pricing, QR codes, and metadata
- **Customers Table**: Customer information for CRM functionality with contact details
- **Sales Table**: Transaction records linking products to customers with sales data and timestamps
- **Stock Movements Table**: Audit trail for all inventory changes with types (in/out/sale/adjustment), quantities, and reasons
- **Serial Numbers Table**: Individual unit tracking with product associations and status management
- **Returns Table**: Product return management with reason tracking, status updates, and resolution dates
- **Relationships**: Comprehensive foreign key constraints maintaining data integrity across all entities

## Key Features
- **Role-Based Access Control**: Four user roles (Admin, Sales, Warehouse, Viewer) with specific permissions
- **Product Management**: CRUD operations with automatic QR code generation and serial number creation
- **Inventory Tracking**: Real-time stock levels with configurable low-stock thresholds and automated alerts
- **Sales Processing**: Complete sales workflow with customer association and automatic inventory updates
- **Stock Movement Audit**: Comprehensive tracking of all stock changes with timestamps, reasons, and user attribution
- **Serial Number Tracking**: Automatic generation and individual unit tracking with status management
- **Returns & Warranty Management**: Product return processing with warranty validation and status tracking
- **Advanced Reporting**: Sales analytics, customer insights, product performance, and inventory forecasting
- **CSV Bulk Import**: Excel-compatible bulk product import with validation and error reporting
- **Label Printing**: 58x40mm Zebra-compatible PDF labels with QR codes and product information
- **Customer QR View**: Limited information display for customer QR code scans with warranty status
- **Advanced CRM**: Enhanced customer profiles with purchase history, analytics, and Excel export
- **QR Code Integration**: Automatic generation, scanning capabilities, and customer-facing verification
- **Dashboard Analytics**: Real-time statistical overview with interactive charts and key metrics
- **Complete Turkish Localization**: All interfaces, messages, and documentation in Turkish

## Development Tools
- **Build System**: Vite with TypeScript compilation and hot module replacement
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Code Quality**: TypeScript strict mode with path aliases for clean imports
- **Development Experience**: Runtime error overlay and Replit integration plugins

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database client and schema management
- **Connection**: Environment-based DATABASE_URL configuration

## UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Shadcn/ui**: Pre-built component library with consistent design system

## Third-party Services
- **QR Code Generation**: QRCode library for product label creation
- **Date Handling**: date-fns for Turkish locale date formatting
- **Form Validation**: Zod schema validation integrated with React Hook Form
- **Icons**: Lucide React for consistent iconography

## Development Dependencies
- **Build Tools**: Vite, ESBuild for production builds
- **TypeScript**: Strict type checking and modern JS features
- **Replit Integration**: Development banner and cartographer plugins for Replit environment