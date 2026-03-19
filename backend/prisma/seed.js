"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding Database...');
    // 0. Clear existing data
    await prisma.commission.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
    // Hash password for all default users
    const defaultPassword = await bcryptjs_1.default.hash('password123', 10);
    // 1. Create Default Users (Roles: Admin, Manager, Agent)
    const adminUser = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@cpre.com',
            password: defaultPassword,
            role: client_1.Role.ADMIN,
            tier: client_1.Tier.ELITE
        }
    });
    const managerUser = await prisma.user.create({
        data: {
            name: 'Regional Manager',
            email: 'manager@cpre.com',
            password: defaultPassword,
            role: client_1.Role.MANAGER,
            tier: client_1.Tier.PRO
        }
    });
    const agentUser = await prisma.user.create({
        data: {
            name: 'Sarah Agent',
            email: 'agent@cpre.com',
            password: defaultPassword,
            role: client_1.Role.AGENT,
            tier: client_1.Tier.CORE
        }
    });
    // 2. Create Clients (assigned to agent)
    const client1 = await prisma.client.create({
        data: {
            firstName: 'John',
            lastName: 'Doe',
            type: client_1.ClientType.BUYER,
            budget: '$1.2M - $1.5M',
            phone: '+1 (212) 555-0198',
            status: client_1.ClientStatus.ACTIVE,
            agentId: agentUser.id
        }
    });
    const client2 = await prisma.client.create({
        data: {
            firstName: 'Jane',
            lastName: 'Smith',
            type: client_1.ClientType.SELLER,
            phone: '+1 (917) 555-0244',
            status: client_1.ClientStatus.ACTIVE,
            agentId: agentUser.id
        }
    });
    const client3 = await prisma.client.create({
        data: {
            firstName: 'Robert',
            lastName: 'Johnson',
            type: client_1.ClientType.BUYER,
            budget: '$800K - $1M',
            phone: '+1 (347) 555-0300',
            status: client_1.ClientStatus.LEAD,
            agentId: agentUser.id
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
            status: client_1.PropStatus.ACTIVE,
            agentId: agentUser.id
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
            status: client_1.PropStatus.IN_CONTRACT,
            agentId: agentUser.id
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
            status: client_1.PropStatus.ACTIVE,
            agentId: agentUser.id
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
            price: 1400000,
            status: client_1.TransStatus.OFFER_REVIEW,
            createdAt: transactionDates[0]
        }
    });
    const trans2 = await prisma.transaction.create({
        data: {
            propertyId: prop2.id,
            clientId: client2.id,
            agentId: agentUser.id,
            price: 900000,
            status: client_1.TransStatus.IN_CONTRACT,
            createdAt: transactionDates[1]
        }
    });
    // 5. Create Commissions
    await prisma.commission.create({
        data: {
            transactionId: trans1.id,
            agentId: agentUser.id,
            grossAmount: 1400000 * 0.03, // 3%
            firmSplitPercent: 25,
            overridePercent: 5,
            netPayout: (1400000 * 0.03) * 0.70, // Remaining 70%
            status: client_1.CommStatus.PENDING
        }
    });
    await prisma.commission.create({
        data: {
            transactionId: trans2.id,
            agentId: agentUser.id,
            grossAmount: 900000 * 0.025, // 2.5%
            firmSplitPercent: 25,
            overridePercent: 0, // No team override
            netPayout: (900000 * 0.025) * 0.75, // Remaining 75%
            status: client_1.CommStatus.PAID,
            paidAt: new Date(2026, 8, 20)
        }
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
