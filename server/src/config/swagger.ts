import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || '3000';
const baseUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${port}`;

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'App Chat API',
      version: '1.0.0',
      description: 'API documentation for the App Chat backend.',
    },
    servers: [
      {
        url: baseUrl,
      },
    ],
    tags: [
      { name: 'Health', description: 'Health and readiness endpoints' },
      { name: 'User', description: 'Authentication and profile endpoints' },
      { name: 'Message', description: 'Messaging endpoints' },
      { name: 'Uploads', description: 'Media upload and retrieval endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'Server is healthy',
            },
          },
        },
      },
      '/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness check',
          responses: {
            200: {
              description: 'Server is ready',
            },
          },
        },
      },
    },
  },
  apis: [],
});
