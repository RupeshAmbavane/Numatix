import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log('Testing database connection...');

        const userCount = await prisma.user.count();
        console.log('✓ Database connected successfully');
        console.log(`Found ${userCount} users in database`);

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        console.log('\nUsers:');
        users.forEach(user => {
            console.log(`- ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Database error:', error);
        process.exit(1);
    }
}

testDatabase();
