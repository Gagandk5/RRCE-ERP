import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let appPromise: Promise<any> | null = null;

async function bootstrap() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
      );
      app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: false,
        }),
      );
      await app.init();
      return app;
    })();
  }
  await appPromise;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
