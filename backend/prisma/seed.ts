import { PrismaClient, ClientType, ClientStatus, PropStatus, TransStatus, Role, Tier, CommStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database...');

    // 0. Clear existing data
    await prisma.commission.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create default Organization
    const defaultOrg = await prisma.organization.create({
        data: {
            name: 'Real Estate Brokerage Management Platform Default Brokerage',
            subscription: 'BASIC'
        }
    });

    // Hash password for all default users
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Create Default Users (Roles: Admin, Manager, Agent)
    const adminUser = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@cpre.com',
            password: defaultPassword,
            role: Role.SUPERADMIN,
            tier: Tier.ELITE,
            orgId: defaultOrg.id
        }
    });

    const managerUser = await prisma.user.create({
        data: {
            name: 'Regional Manager',
            email: 'manager@cpre.com',
            password: defaultPassword,
            role: Role.MANAGER,
            tier: Tier.PRO,
            orgId: defaultOrg.id
        }
    });

    const agentUser = await prisma.user.create({
        data: {
            name: 'Sarah Agent',
            email: 'agent@cpre.com',
            password: defaultPassword,
            role: Role.AGENT,
            tier: Tier.CORE,
            orgId: defaultOrg.id
        }
    });

    // 2. Create Clients (assigned to agent)
    const client1 = await prisma.client.create({
        data: {
            firstName: 'John',
            lastName: 'Doe',
            type: ClientType.BUYER,
            budget: '$1.2M - $1.5M',
            phone: '+1 (212) 555-0198',
            status: ClientStatus.ACTIVE,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    const client2 = await prisma.client.create({
        data: {
            firstName: 'Jane',
            lastName: 'Smith',
            type: ClientType.SELLER,
            phone: '+1 (917) 555-0244',
            status: ClientStatus.ACTIVE,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    const client3 = await prisma.client.create({
        data: {
            firstName: 'Robert',
            lastName: 'Johnson',
            type: ClientType.BUYER,
            budget: '$800K - $1M',
            phone: '+1 (347) 555-0300',
            status: ClientStatus.LEAD,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    // 3. Create Properties (assigned to agent)
    const prop1 = await prisma.property.create({
        data: {
            address: '123 Main Street, Apt 1A',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            price: 1450000,
            beds: 2,
            baths: 2,
            sqft: 1200,
            description: 'Luxury apartment in a prime location.',
            status: PropStatus.ACTIVE,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    const prop2 = await prisma.property.create({
        data: {
            address: '88 Greenwich St, #1204',
            city: 'New York',
            state: 'NY',
            zip: '10006',
            price: 950000,
            beds: 1,
            baths: 1,
            sqft: 850,
            description: 'Modern condo with great views.',
            status: PropStatus.IN_CONTRACT,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    const prop3 = await prisma.property.create({
        data: {
            address: '45 Park Ave, Ph 2',
            city: 'New York',
            state: 'NY',
            zip: '10016',
            price: 2500000,
            beds: 3,
            baths: 2.5,
            sqft: 2200,
            description: 'Luxurious penthouse.',
            status: PropStatus.ACTIVE,
            agentId: agentUser.id,
            orgId: defaultOrg.id
        }
    });

    // 4. Create Transactions (Deals)
    const transactionDates = [
        new Date(2026, 9, 15),
        new Date(2026, 8, 10),
        new Date(2026, 7, 5),
    ];

    const trans1 = await prisma.transaction.create({
        data: {
            propertyId: prop1.id,
            clientId: client1.id,
            agentId: agentUser.id,
            orgId: defaultOrg.id,
            price: 1400000,
            status: TransStatus.OFFER_REVIEW,
            createdAt: transactionDates[0]
        }
    });

    const trans2 = await prisma.transaction.create({
        data: {
            propertyId: prop2.id,
            clientId: client2.id,
            agentId: agentUser.id,
            orgId: defaultOrg.id,
            price: 900000,
            status: TransStatus.IN_CONTRACT,
            createdAt: transactionDates[1]
        }
    });

    // 5. Create Commissions
    await prisma.commission.create({
        data: {
            transactionId: trans1.id,
            agentId: agentUser.id,
            orgId: defaultOrg.id,
            grossAmount: 1400000 * 0.03, // 3%
            firmSplitPercent: 25,
            overridePercent: 5,
            netPayout: (1400000 * 0.03) * 0.70, // Remaining 70%
            status: CommStatus.PENDING
        }
    });

    await prisma.commission.create({
        data: {
            transactionId: trans2.id,
            agentId: agentUser.id,
            orgId: defaultOrg.id,
            grossAmount: 900000 * 0.025, // 2.5%
            firmSplitPercent: 25,
            overridePercent: 0, // No team override
            netPayout: (900000 * 0.025) * 0.75, // Remaining 75%
            status: CommStatus.PAID,
            paidAt: new Date(2026, 8, 20)
        }
    });

}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
