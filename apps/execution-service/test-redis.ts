import { createClient } from 'redis';

async function testRedis() {
    const redisUrl = 'redis://localhost:6379';
    console.log('Testing Redis connection...');
    console.log('Redis URL:', redisUrl);

    const client = createClient({ url: redisUrl });

    client.on('error', (err) => {
        console.error('Redis Error:', err);
    });

    try {
        await client.connect();
        console.log('✓ Connected to Redis');

        // Test publish
        const result = await client.publish('test:channel', 'Hello Redis!');
        console.log('Published message, subscribers:', result);

        // Check channels
        const channels = await client.sendCommand(['PUBSUB', 'CHANNELS']);
        console.log('Active channels:', channels);

        await client.disconnect();
        console.log('✓ Disconnected');
    } catch (error) {
        console.error('Error:', error);
    }
}

testRedis();
