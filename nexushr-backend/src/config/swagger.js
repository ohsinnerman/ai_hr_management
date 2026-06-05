import swaggerJsDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexusHR API',
      version: '1.0.0',
      description: 'AI-Powered Human Resource Management System — FWC IT Services Pvt. Ltd.',
      contact: { name: 'FWC IT Services', email: 'tech@fwcit.com' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Local Development' },
      { url: 'https://api.nexushr.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  // Scan all module route + controller files for JSDoc @swagger comments.
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.controller.js'],
};

export const swaggerSpec = swaggerJsDoc(options);
