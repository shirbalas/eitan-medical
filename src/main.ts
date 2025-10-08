import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProblemFilter } from './common/filters/problem.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ProblemFilter());

  app.use((req: any, res, next) => {
    if (req?.id) res.setHeader('x-request-id', req.id);
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Eitan Medical API')
    .setDescription('Patients & Heart Rate endpoints')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(3000);
}
bootstrap();
