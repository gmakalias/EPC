// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // =============================================
  // 1. ROLES & PERMISSIONS
  // =============================================
  console.log('Creating roles and permissions...');

  const permissions = [
    // Product permissions
    { name: 'product.create', resource: 'product', action: 'create', description: 'Create product specifications' },
    { name: 'product.read', resource: 'product', action: 'read', description: 'View product specifications' },
    { name: 'product.update', resource: 'product', action: 'update', description: 'Update product specifications' },
    { name: 'product.delete', resource: 'product', action: 'delete', description: 'Delete product specifications' },
    { name: 'product.approve', resource: 'product', action: 'approve', description: 'Approve product changes' },

    // Offering permissions
    { name: 'offering.create', resource: 'offering', action: 'create', description: 'Create product offerings' },
    { name: 'offering.read', resource: 'offering', action: 'read', description: 'View product offerings' },
    { name: 'offering.update', resource: 'offering', action: 'update', description: 'Update product offerings' },
    { name: 'offering.delete', resource: 'offering', action: 'delete', description: 'Delete product offerings' },

    // Subscription permissions
    { name: 'subscription.create', resource: 'subscription', action: 'create', description: 'Create subscriptions' },
    { name: 'subscription.read', resource: 'subscription', action: 'read', description: 'View subscriptions' },
    { name: 'subscription.update', resource: 'subscription', action: 'update', description: 'Update subscriptions' },
    { name: 'subscription.delete', resource: 'subscription', action: 'delete', description: 'Delete subscriptions' },

    // Pricing permissions
    { name: 'pricing.create', resource: 'pricing', action: 'create', description: 'Create pricing plans' },
    { name: 'pricing.read', resource: 'pricing', action: 'read', description: 'View pricing plans' },
    { name: 'pricing.update', resource: 'pricing', action: 'update', description: 'Update pricing plans' },
    { name: 'pricing.delete', resource: 'pricing', action: 'delete', description: 'Delete pricing plans' },

    // Category permissions
    { name: 'category.manage', resource: 'category', action: 'manage', description: 'Manage categories' },

    // Lifecycle permissions
    { name: 'lifecycle.approve', resource: 'lifecycle', action: 'approve', description: 'Approve lifecycle transitions' },
    { name: 'lifecycle.reject', resource: 'lifecycle', action: 'reject', description: 'Reject lifecycle transitions' },

    // Service permissions
    { name: 'service.create', resource: 'service', action: 'create', description: 'Create services' },
    { name: 'service.read', resource: 'service', action: 'read', description: 'View services' },
    { name: 'service.update', resource: 'service', action: 'update', description: 'Update services' },

    // Audit permissions
    { name: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },

    // User management
    { name: 'user.manage', resource: 'user', action: 'manage', description: 'Manage users' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System Administrator - Full Access',
      isSystemRole: true,
    },
  });

  const productManagerRole = await prisma.role.upsert({
    where: { name: 'product_manager' },
    update: {},
    create: {
      name: 'product_manager',
      description: 'Product Manager - Catalog Management',
      isSystemRole: true,
    },
  });

  const pricingAnalystRole = await prisma.role.upsert({
    where: { name: 'pricing_analyst' },
    update: {},
    create: {
      name: 'pricing_analyst',
      description: 'Pricing Analyst - Pricing Configuration',
      isSystemRole: true,
    },
  });

  const operationsRole = await prisma.role.upsert({
    where: { name: 'operations' },
    update: {},
    create: {
      name: 'operations',
      description: 'Operations Team - Subscription Management',
      isSystemRole: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Read-Only Access',
      isSystemRole: true,
    },
  });

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();

  // Admin gets all permissions
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Product Manager permissions
  const productManagerPerms = allPermissions.filter(p =>
    ['product.', 'offering.', 'category.', 'pricing.read'].some(prefix => p.name.startsWith(prefix))
  );
  for (const perm of productManagerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: productManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: productManagerRole.id, permissionId: perm.id },
    });
  }

  // Pricing Analyst permissions
  const pricingPerms = allPermissions.filter(p =>
    ['pricing.', 'product.read', 'offering.read'].some(prefix => p.name.startsWith(prefix))
  );
  for (const perm of pricingPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: pricingAnalystRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: pricingAnalystRole.id, permissionId: perm.id },
    });
  }

  // Operations permissions
  const operationsPerms = allPermissions.filter(p =>
    ['subscription.', 'service.'].some(prefix => p.name.startsWith(prefix))
  );
  for (const perm of operationsPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: operationsRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: operationsRole.id, permissionId: perm.id },
    });
  }

  // Viewer permissions
  const viewerPerms = allPermissions.filter(p => p.action === 'read');
  for (const perm of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: perm.id },
    });
  }

  // =============================================
  // 2. USERS
  // =============================================
  console.log('Creating users...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@telco.gr' },
    update: {},
    create: {
      email: 'admin@telco.gr',
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@telco.gr' },
    update: {},
    create: {
      email: 'pm@telco.gr',
      username: 'product_manager',
      fullName: 'Product Manager',
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: pmUser.id, roleId: productManagerRole.id } },
    update: {},
    create: { userId: pmUser.id, roleId: productManagerRole.id },
  });

  // =============================================
  // 3. CATEGORIES
  // =============================================
  console.log('Creating categories...');

  const mobileCategory = await prisma.category.upsert({
    where: { id: 'cat-mobile' },
    update: {},
    create: {
      id: 'cat-mobile',
      name: 'Mobile Services',
      description: 'Mobile voice, SMS, and data services',
      isRoot: true,
      displayOrder: 1,
      path: '/mobile',
      level: 1,
      icon: '📱',
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-postpaid' },
    update: {},
    create: {
      id: 'cat-postpaid',
      name: 'Postpaid',
      description: 'Postpaid mobile plans',
      parentId: mobileCategory.id,
      displayOrder: 1,
      path: '/mobile/postpaid',
      level: 2,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-prepaid' },
    update: {},
    create: {
      id: 'cat-prepaid',
      name: 'Prepaid',
      description: 'Prepaid mobile plans',
      parentId: mobileCategory.id,
      displayOrder: 2,
      path: '/mobile/prepaid',
      level: 2,
    },
  });

  const internetCategory = await prisma.category.upsert({
    where: { id: 'cat-internet' },
    update: {},
    create: {
      id: 'cat-internet',
      name: 'Internet Services',
      description: 'Fixed broadband services',
      isRoot: true,
      displayOrder: 2,
      path: '/internet',
      level: 1,
      icon: '🌐',
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-fiber' },
    update: {},
    create: {
      id: 'cat-fiber',
      name: 'Fiber',
      description: 'Fiber optic internet',
      parentId: internetCategory.id,
      displayOrder: 1,
      path: '/internet/fiber',
      level: 2,
    },
  });

  // =============================================
  // 4. DISTRIBUTION CHANNELS
  // =============================================
  console.log('Creating distribution channels...');

  await prisma.distributionChannel.upsert({
    where: { name: 'Online Store' },
    update: {},
    create: {
      name: 'Online Store',
      channelType: 'online',
      description: 'Web and mobile e-commerce platform',
      isActive: true,
    },
  });

  await prisma.distributionChannel.upsert({
    where: { name: 'Retail Stores' },
    update: {},
    create: {
      name: 'Retail Stores',
      channelType: 'retail',
      description: 'Physical retail locations',
      isActive: true,
    },
  });

  await prisma.distributionChannel.upsert({
    where: { name: 'Partner Network' },
    update: {},
    create: {
      name: 'Partner Network',
      channelType: 'partner',
      description: 'Third-party resellers and partners',
      isActive: true,
    },
  });

  // =============================================
  // 5. SAMPLE PRODUCTS
  // =============================================
  console.log('Creating sample products...');

  const mobileSpec = await prisma.productSpecification.create({
    data: {
      name: 'Mobile Hybrid Specification',
      description: 'Hybrid mobile plan with voice, SMS, and data',
      version: '2.1',
      status: 'active',
      categoryId: mobileCategory.id,
      productNumber: 'SPEC-MOB-001',
      createdById: adminUser.id,
      characteristics: {
        create: [
          { name: 'Voice Minutes', description: 'Monthly voice call allowance', valueType: 'number', unitOfMeasure: 'minutes', isRequired: true, defaultValue: '1000' },
          { name: 'SMS Count', description: 'Monthly SMS allowance', valueType: 'number', unitOfMeasure: 'messages', isRequired: true, defaultValue: '1000' },
          { name: 'Data Volume', description: 'Monthly data allowance', valueType: 'number', unitOfMeasure: 'GB', isRequired: true, defaultValue: '50' },
          { name: 'Network Type', description: 'Mobile network technology', valueType: 'enum', isRequired: true, allowedValues: ['4G', '5G'], defaultValue: '5G' },
        ],
      },
    },
  });

  const onlineChannel = await prisma.distributionChannel.findUnique({ where: { name: 'Online Store' } });
  const retailChannel = await prisma.distributionChannel.findUnique({ where: { name: 'Retail Stores' } });

  const mobileOffering = await prisma.productOffering.create({
    data: {
      name: 'COSMOTE Hybrid 550',
      description: 'Premium hybrid mobile plan with unlimited calls, SMS and 50GB data',
      version: '3.0',
      status: 'active',
      specificationId: mobileSpec.id,
      isSellable: true,
      sellingMode: 'online',
      validForStart: new Date('2026-01-01'),
      createdById: adminUser.id,
      metadata: { operator: 'COSMOTE', tmCode: '550', networkProfile: 'Hybrid' },
      channelMappings: {
        create: [
          { channelId: onlineChannel!.id, isEnabled: true, displayOrder: 1 },
          { channelId: retailChannel!.id, isEnabled: true, displayOrder: 2 },
        ],
      },
    },
  });

 // =============================================
  // 6. PRICING PLAN (FIXED)
  // =============================================
  console.log('Creating pricing plans...');

  // STEP A: Ensure we have an offering to attach to.
  // If you created one earlier called 'offering', this works.
  // If not, we fetch the first one available:
  const targetOffering = await prisma.productOffering.findFirst();

  if (!targetOffering) {
    throw new Error('Could not find any ProductOffering to attach the Pricing Plan to. Make sure Step 5 creates one!');
  }

  await prisma.pricingPlan.create({
    data: {
      // Connect using the ID from the offering we just found or defined
      offering: { 
        connect: { id: targetOffering.id } 
      },
      name: "Standard Plan",
      description: "Standard pricing plan",
      
      // These must match your Prisma Schema Enums/Types exactly
      type: "RECURRING", 
      period: "MONTHLY",
      pricingType: "RECURRING", 
      
      currency: "EUR",
      isActive: true,
      priceComponents: {
        create: [
          {
            componentType: "BASE_FEE",
            name: "Monthly Fee",
            amount: 29.99,
            currency: "EUR",
            // If your schema requires 'recurrencePeriod' here too, add it:
            // recurrencePeriod: "MONTHLY" 
          },
        ],
      },
    },
  });

  // =============================================
  // 7. CFS/RFS/RESOURCES
  // =============================================
  console.log('Creating services and resources...');

  const voiceCfs = await prisma.cfsService.create({
    data: {
      name: 'Voice Service',
      description: 'Voice call service',
      serviceType: 'voice',
      parameters: { codec: 'AMR-WB', quality: 'HD' },
    },
  });

  const smsCfs = await prisma.cfsService.create({
    data: {
      name: 'SMS Service',
      description: 'Text messaging service',
      serviceType: 'sms',
      parameters: { encoding: 'GSM-7', maxLength: 160 },
    },
  });

  const dataCfs = await prisma.cfsService.create({
    data: {
      name: 'Data Service',
      description: 'Mobile data service',
      serviceType: 'data',
      parameters: { bearer: '5G', speed: '1Gbps' },
    },
  });

  const voiceRfs = await prisma.rfsService.create({
    data: {
      name: 'Voice RFS',
      description: 'Voice provisioning service',
      cfsServiceId: voiceCfs.id,
      serviceType: 'voice_provisioning',
      parameters: { protocol: 'SIP', qos: 'Class 1' },
    },
  });

  const smsRfs = await prisma.rfsService.create({
    data: {
      name: 'SMS RFS',
      description: 'SMS routing service',
      cfsServiceId: smsCfs.id,
      serviceType: 'sms_routing',
      parameters: { smsc: 'SMSC-01', protocol: 'SMPP 3.4' },
    },
  });

  const dataRfs = await prisma.rfsService.create({
    data: {
      name: 'Data RFS',
      description: 'Data bearer service',
      cfsServiceId: dataCfs.id,
      serviceType: 'data_bearer',
      parameters: { apn: 'internet', qci: 'QCI-9' },
    },
  });

  const msisdnResource = await prisma.resource.create({
    data: {
      name: 'MSISDN Pool',
      resourceType: 'msisdn',
      status: 'available',
      parameters: { range: '+30694XXXXXXX', poolSize: '100000' },
    },
  });

  const simResource = await prisma.resource.create({
    data: {
      name: 'SIM Inventory',
      resourceType: 'sim',
      status: 'available',
      parameters: { type: 'USIM', format: 'Nano' },
    },
  });

  await prisma.rfsResourceMapping.createMany({
    data: [
      { rfsServiceId: voiceRfs.id, resourceId: msisdnResource.id },
      { rfsServiceId: smsRfs.id, resourceId: msisdnResource.id },
      { rfsServiceId: dataRfs.id, resourceId: msisdnResource.id },
      { rfsServiceId: dataRfs.id, resourceId: simResource.id },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin: admin@telco.gr / password123');
  console.log('   Product Manager: pm@telco.gr / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });