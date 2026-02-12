import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('FlowPay Support API')
    .setDescription(
      'Sistema de Distribuição de Atendimentos - API REST para gerenciamento de tickets, agentes e times',
    )
    .setVersion('1.0')
    .addTag('teams', 'Gerenciamento de Times')
    .addTag('agents', 'Gerenciamento de Atendentes')
    .addTag('tickets', 'Gerenciamento de Tickets')
    .addTag('dashboard', 'Dashboard e Estatísticas')
    .addTag('health', 'Health Check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'FlowPay Support API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Port Configuration
  const port = process.env.API_PORT || 3000;

  await app.listen(port);

  console.log('');
  console.log('🚀 FlowPay Support Backend is running!');
  console.log('');
  console.log(`📡 API URL:        http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs:  http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket:     ws://localhost:${port}`);
  console.log('');
  console.log('💡 Press CTRL+C to stop the server');
  console.log('');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
