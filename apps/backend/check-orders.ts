import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
    console.log('Checking recent orders...\n');

    const orders = await prisma.orderCommand.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    console.log('Recent OrderCommands:');
    orders.forEach(order => {
        console.log(`- ${order.orderId}: ${order.symbol} ${order.side} ${order.type} | Status: ${order.status} | Price: ${order.price}`);
    });

    console.log('\n\nChecking OrderEvents...\n');

    const events = await prisma.orderEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
    });

    console.log('Recent OrderEvents:');
    events.forEach(event => {
        console.log(`- ${event.orderId}: ${event.symbol} ${event.side} | Status: ${event.status} | Price: ${event.price}`);
    });

    await prisma.$disconnect();
}

checkOrders().catch(console.error);
