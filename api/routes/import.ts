import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { Farmer, Branch, Line, AuditLog } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validatePhoneNumber } from '../utils/validation';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx) and CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Upload and Preview Farmer Data
 * POST /api/import/farmers/preview
 */
router.post('/farmers/preview', authenticate, authorize(['admin']), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      res.status(400).json({ error: 'File is empty' });
      return;
    }

    // Validate required columns
    const requiredColumns = ['name', 'phone', 'address', 'village', 'district', 'state', 'pincode', 'lineCode'];
    const firstRow = data[0] as Record<string, unknown>;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      });
      return;
    }

    const previewData = [];
    const errors = [];
    const warnings = [];

    for (let i = 0; i < Math.min(data.length, 100); i++) { // Preview first 100 rows
      const row = data[i] as Record<string, unknown>;
      const rowErrors = [];
      const rowWarnings = [];

      // Validate required fields
      if (!row.name || row.name.toString().trim() === '') {
        rowErrors.push('Name is required');
      }

      if (!row.phone || !validatePhoneNumber(row.phone.toString())) {
        rowErrors.push('Invalid phone number (must be 10-13 digits)');
      }

      if (!row.pincode || row.pincode.toString().length !== 6) {
        rowErrors.push('Invalid pincode (must be 6 digits)');
      }

      // Check if line exists
      const line = await Line.findOne({ 
        where: { code: row.lineCode.toString().toUpperCase() },
        include: [{ model: Branch, as: 'branch', include: ['zone'] }]
      });

      if (!line) {
        rowErrors.push(`Line with code ${row.lineCode} not found`);
      }

      // Check for duplicate phone numbers
      const existingFarmer = await Farmer.findOne({ 
        where: { phone: row.phone.toString() } 
      });

      if (existingFarmer) {
        rowWarnings.push('Farmer with this phone number already exists (will be updated)');
      }

      previewData.push({
        rowNumber: i + 2, // Excel row number (1-based + header)
        data: {
          name: row.name?.toString() || '',
          phone: row.phone?.toString() || '',
          email: row.email?.toString() || '',
          address: row.address?.toString() || '',
          village: row.village?.toString() || '',
          district: row.district?.toString() || '',
          state: row.state?.toString() || '',
          pincode: row.pincode?.toString() || '',
          lineCode: row.lineCode?.toString() || ''
        },
        errors: rowErrors,
        warnings: rowWarnings,
        line: line ? {
          id: line.id,
          name: line.name,
          code: line.code
        } : null
      });

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: i + 2,
          errors: rowErrors
        });
      }
    }

    res.json({
      preview: previewData,
      totalRows: data.length,
      previewRows: Math.min(data.length, 100),
      errors,
      warnings
    });
  } catch (error) {
    console.error('Preview import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Import Farmers Data
 * POST /api/import/farmers/import
 */
router.post('/farmers/import', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      res.status(400).json({ error: 'No data provided for import' });
      return;
    }

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const row of data) {
      try {
        const { name, phone, email, address, village, district, state, pincode, lineCode } = row;

        // Validate data
        if (!name || !phone || !address || !village || !district || !state || !pincode || !lineCode) {
          results.errors.push({
            row: row,
            error: 'Missing required fields'
          });
          results.skipped++;
          continue;
        }

        if (!validatePhoneNumber(phone)) {
          results.errors.push({
            row: row,
            error: 'Invalid phone number'
          });
          results.skipped++;
          continue;
        }

        // Get line details
        const line = await Line.findOne({ 
          where: { code: lineCode.toUpperCase() },
          include: [{ model: Branch, as: 'branch' }]
        });

        if (!line) {
          results.errors.push({
            row: row,
            error: `Line with code ${lineCode} not found`
          });
          results.skipped++;
          continue;
        }

        // Check if farmer exists
        const existingFarmer = await Farmer.findOne({ 
          where: { phone: phone.toString() } 
        });

        if (existingFarmer) {
          // Update existing farmer
          await existingFarmer.update({
            name,
            email: email || null,
            address,
            village,
            district,
            state,
            pincode,
            lineId: line.id,
            branchId: line.branchId,
            zoneId: line.branchId
          });
          results.updated++;
        } else {
          // Create new farmer
          await Farmer.create({
            name,
            phone: phone.toString(),
            email: email || null,
            address,
            village,
            district,
            state,
            pincode,
            lineId: line.id,
            branchId: line.branchId,
            zoneId: line.branchId,
            isActive: true
          });
          results.added++;
        }
      } catch (error) {
        results.errors.push({
          row: row,
          error: error.message
        });
        results.skipped++;
      }
    }

    // Log the import activity
    await AuditLog.create({
      userId: req.user!.id,
      action: 'import',
      entity: 'Farmers',
      newValues: JSON.stringify({
        type: 'bulk_import',
        results,
        timestamp: new Date()
      })
    });

    res.json({
      message: 'Import completed successfully',
      results
    });
  } catch (error) {
    console.error('Import farmers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Download Import Template
 * GET /api/import/farmers/template
 */
router.get('/farmers/template', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const templateData = [
      {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        address: '123 Main Street',
        village: 'Green Village',
        district: 'North District',
        state: 'State',
        pincode: '123456',
        lineCode: 'LINE001'
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Add headers with descriptions
    const headers = [
      ['Farmer Import Template'],
      ['Instructions: Fill in the data below and upload the file. All fields are required except email.'],
      [''],
      ['name', 'phone', 'email', 'address', 'village', 'district', 'state', 'pincode', 'lineCode'],
      ['John Doe', '9876543210', 'john@example.com', '123 Main Street', 'Green Village', 'North District', 'State', '123456', 'LINE001']
    ];

    XLSX.utils.sheet_add_aoa(worksheet, headers, { origin: 'A1' });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmers Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=farmer-import-template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;