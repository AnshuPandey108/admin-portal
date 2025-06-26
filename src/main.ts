import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get(DataSource);

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error.message);
  }

  const PORT = 3000;
  await app.listen(PORT);
  console.log(`🚀 Server is running at: http://localhost:${PORT}`);
}
bootstrap();
