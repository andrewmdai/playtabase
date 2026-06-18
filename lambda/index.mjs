import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.TABLE_REGION ?? 'us-east-2' })
);
const TABLE = process.env.TABLE_NAME ?? 'playtabase';

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const { method } = event.requestContext.http;
  const id = event.pathParameters?.id;

  try {
    // GET /games — return all games
    if (method === 'GET') {
      const { Items } = await dynamo.send(new ScanCommand({ TableName: TABLE }));
      return respond(200, Items ?? []);
    }

    // PUT /games/{id} — create or update a game
    if (method === 'PUT' && id) {
      const game = JSON.parse(event.body);
      await dynamo.send(new PutCommand({ TableName: TABLE, Item: game }));
      return respond(200, game);
    }

    // DELETE /games/{id} — remove a game
    if (method === 'DELETE' && id) {
      await dynamo.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
      return respond(200, { id });
    }

    return respond(404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    return respond(500, { error: err.message });
  }
};
