import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { games } from '../src/data/games.js';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' })
);

const TABLE = process.env.TABLE_NAME ?? 'playtabase-games';

let seeded = 0;
for (let i = 0; i < games.length; i += 25) {
  const chunk = games.slice(i, i + 25);
  await client.send(new BatchWriteCommand({
    RequestItems: {
      [TABLE]: chunk.map((game) => ({ PutRequest: { Item: game } })),
    },
  }));
  seeded += chunk.length;
  console.log(`Wrote ${seeded}/${games.length}...`);
}

console.log('Done.');
