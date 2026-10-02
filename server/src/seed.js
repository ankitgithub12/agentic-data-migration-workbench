import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import { MigrationProject } from './models/MigrationProject.js';
import { MigrationPlan } from './models/MigrationPlan.js';
import { MigrationRun } from './models/MigrationRun.js';
import { QuarantinedRecord } from './models/QuarantinedRecord.js';
import { TargetCustomer } from './models/TargetCustomer.js';
import { AuditLog } from './models/AuditLog.js';
import { logger } from './config/logger.js';

export const generateSeedSampleRecords = () => {
  const records = [];

  const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Neha', 'Karan', 'Pooja',
    'Arjun', 'Divya', 'Sanjay', 'Deepa', 'Manish', 'Kavita', 'Aditya', 'Meera', 'Gaurav', 'Ritu'
  ];
  const lastNames = [
    'Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Joshi', 'Mehta', 'Nair', 'Reddy',
    'Chopra', 'Malhotra', 'Bhatia', 'Iyer', 'Saxena', 'Deshmukh', 'Das', 'Roy', 'Choudhury', 'Bose'
  ];
  const cities = ['mumbai', 'delhi', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata'];

  // 1. Generate 80 Valid Records (IDs 101 - 180)
  for (let i = 1; i <= 80; i++) {
    const id = 100 + i;
    const fn = firstNames[(i - 1) % firstNames.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    const month = String(((i % 12) + 1)).padStart(2, '0');
    const day = String(((i % 28) + 1)).padStart(2, '0');
    records.push({
      customer_id: id,
      full_name: `${fn} ${ln}`,
      email_address: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      phone: `98${String(10000000 + i * 1111).slice(0, 8)}`,
      created: `2026-${month}-${day}`,
      region: cities[i % cities.length],
    });
  }

  // 2. Records with whitespace / case variations (IDs 181 - 185) -> Fixed by transformations
  records.push(
    {
      customer_id: 181,
      full_name: '  Siddharth   Nambiar  ',
      email_address: '  SIDDHARTH.NAMBIAR@EXAMPLE.COM  ',
      phone: '9876543211',
      created: '2026-04-12',
      region: 'mumbai',
    },
    {
      customer_id: 182,
      full_name: 'Tarun   Kapoor',
      email_address: 'Tarun.Kapoor@Example.Com',
      phone: '+91-9876543212',
      created: '2026-05-18T00:00:00.000Z',
      region: 'delhi',
    },
    {
      customer_id: 183,
      full_name: 'Sunita Rao',
      email_address: 'sunita.rao@domain.co.in',
      phone: '9876543213',
      created: '2026-06-01',
      region: 'bangalore',
    },
    {
      customer_id: 184,
      full_name: 'Naveen   Krishnan',
      email_address: 'naveen.k@corp.org',
      phone: '9876543214',
      created: '2026-07-15',
      region: 'chennai',
    },
    {
      customer_id: 185,
      full_name: 'Leela Menon',
      email_address: 'LEELA.MENON@OUTLOOK.COM',
      phone: '9876543215',
      created: '2026-08-20',
      region: 'kochi',
    }
  );

  // 3. Records with Invalid Emails (IDs 186 - 190) -> Rejected into Quarantine
  records.push(
    {
      customer_id: 186,
      full_name: 'Akash Oberoi',
      email_address: 'akash.oberoi-without-at',
      phone: '9876543216',
      created: '2026-01-10',
      region: 'delhi',
    },
    {
      customer_id: 187,
      full_name: 'Bhavna Kulkarni',
      email_address: 'bhavna@',
      phone: '9876543217',
      created: '2026-02-14',
      region: 'pune',
    },
    {
      customer_id: 188,
      full_name: 'Chetan Bhagat',
      email_address: '@missing-username.com',
      phone: '9876543218',
      created: '2026-03-21',
      region: 'mumbai',
    },
    {
      customer_id: 189,
      full_name: 'Disha Patani',
      email_address: 'disha..double-dot@domain.com',
      phone: '9876543219',
      created: '2026-04-05',
      region: 'hyderabad',
    },
    {
      customer_id: 190,
      full_name: 'Farhan Akhtar',
      email_address: 'farhan@nowhere',
      phone: '9876543220',
      created: '2026-05-12',
      region: 'delhi',
    }
  );

  // 4. Records with Missing Required Fields (IDs 191 - 193) -> Rejected into Quarantine
  records.push(
    {
      customer_id: 191,
      full_name: '', // Missing required name
      email_address: 'noname@example.com',
      phone: '9876543221',
      created: '2026-06-19',
      region: 'mumbai',
    },
    {
      customer_id: 192,
      full_name: null, // Null required name
      email_address: 'nullname@example.com',
      phone: '9876543222',
      created: '2026-07-22',
      region: 'kolkata',
    },
    {
      customer_id: null, // Null required customerId
      full_name: 'Omkar Salunkhe',
      email_address: 'omkar@example.com',
      phone: '9876543223',
      created: '2026-08-11',
      region: 'pune',
    }
  );

  // 5. Records with Invalid Dates (IDs 194 - 196) -> Rejected into Quarantine
  records.push(
    {
      customer_id: 194,
      full_name: 'Geeta Phogat',
      email_address: 'geeta@example.com',
      phone: '9876543224',
      created: 'not-a-valid-date-string',
      region: 'haryana',
    },
    {
      customer_id: 195,
      full_name: 'Harish Rawat',
      email_address: 'harish@example.com',
      phone: '9876543225',
      created: '9999-99-99',
      region: 'dehradun',
    },
    {
      customer_id: 196,
      full_name: 'Isha Koppikar',
      email_address: 'isha@example.com',
      phone: '9876543226',
      created: 'invalid_iso_time',
      region: 'mumbai',
    }
  );

  // 6. Duplicate Records reusing existing customer_ids (101, 102, 103, 104) -> Tested by Idempotency
  records.push(
    {
      customer_id: 101, // Duplicate ID of record 1
      full_name: 'Rahul Sharma Duplicate',
      email_address: 'rahul.dup@example.com',
      phone: '9876543210',
      created: '2026-09-20',
      region: 'mumbai',
    },
    {
      customer_id: 102, // Duplicate ID of record 2
      full_name: 'Priya Patel Duplicate',
      email_address: 'priya.dup@example.com',
      phone: '9876543211',
      created: '2026-09-21',
      region: 'delhi',
    },
    {
      customer_id: 103, // Duplicate ID of record 3
      full_name: 'Amit Verma Duplicate',
      email_address: 'amit.dup@example.com',
      phone: '9876543212',
      created: '2026-09-22',
      region: 'bangalore',
    },
    {
      customer_id: 104, // Duplicate ID of record 4
      full_name: 'Sneha Singh Duplicate',
      email_address: 'sneha.dup@example.com',
      phone: '9876543213',
      created: '2026-09-23',
      region: 'pune',
    }
  );

  return records;
};

export const seedDatabase = async () => {
  logger.info({ event: 'SEED_STARTED' }, 'Starting database seeding...');
  await connectDB();

  // Clear existing collections
  await MigrationProject.deleteMany({});
  await MigrationPlan.deleteMany({});
  await MigrationRun.deleteMany({});
  await QuarantinedRecord.deleteMany({});
  await TargetCustomer.deleteMany({});
  await AuditLog.deleteMany({});

  const sampleRecords = generateSeedSampleRecords();

  const sourceSchema = {
    name: 'legacy_customers',
    description: 'Legacy Customer Relationship Management dataset (pre-2026 format)',
    fields: {
      customer_id: {
        type: 'number',
        required: true,
        description: 'Legacy integer customer identifier',
      },
      full_name: {
        type: 'string',
        required: true,
        description: 'Customer full name (may contain untrimmed whitespace)',
      },
      email_address: {
        type: 'string',
        required: true,
        format: 'email',
        description: 'Customer primary contact email (mixed case)',
      },
      phone: {
        type: 'string',
        required: false,
        format: 'phone',
        description: 'Contact phone number string',
      },
      created: {
        type: 'string',
        required: true,
        description: 'Account creation date string',
      },
      region: {
        type: 'string',
        required: false,
        description: 'Geographic branch or region (legacy only)',
      },
    },
  };

  const targetSchema = {
    name: 'customers',
    description: 'Enterprise unified customer data model',
    fields: {
      customerId: {
        type: 'number',
        required: true,
        description: 'Unique integer customer ID in target catalog',
      },
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        description: 'Customer trimmed display name',
      },
      email: {
        type: 'string',
        required: true,
        format: 'email',
        description: 'RFC compliant lowercase email address',
      },
      phoneNumber: {
        type: 'string',
        required: false,
        format: 'phone',
        description: 'Normalized phone number',
      },
      createdAt: {
        type: 'date',
        required: true,
        description: 'ISO-8601 standardized timestamp',
      },
    },
  };

  const project = await MigrationProject.create({
    name: 'Legacy CRM to Enterprise Customer Migration',
    description: 'End-to-end migration of bounded customer records from legacy CRM schema to new target platform.',
    sourceSchema,
    targetSchema,
    sampleRecords,
    supportedTransformations: [
      'DIRECT',
      'STRING_TRIM',
      'LOWERCASE',
      'UPPERCASE',
      'STRING_TO_NUMBER',
      'NUMBER_TO_STRING',
      'DATE_ISO',
      'DATE_TO_ISO',
      'BOOLEAN_NORMALIZE',
      'NULL_TO_DEFAULT',
      'SPLIT_FULL_NAME',
    ],
    status: 'ACTIVE',
  });

  await AuditLog.create({
    event: 'PROJECT_CREATED',
    projectId: project._id,
    actor: 'SYSTEM_SEED',
    metadata: {
      projectName: project.name,
      sampleRecordsCount: sampleRecords.length,
    },
  });

  logger.info(
    {
      event: 'SEED_COMPLETED',
      projectId: project._id,
      sampleRecordsCount: sampleRecords.length,
    },
    `Database successfully seeded! Created project "${project.name}" with ${sampleRecords.length} records.`
  );

  return project;
};

// If run directly via `node src/seed.js`
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      console.log('Seed completed successfully.');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
