import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from './users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get(DataSource);
  const usersService = app.get(UsersService);

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('PostgreSQL connection established');
    }

    // Check if Super Admin exists
    const superAdmin = await usersService.findByEmail('superadmin@admin.com');
    if (!superAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await usersService.create({
        email: 'superadmin@admin.com',
        password: hash,
        role: UserRole.SUPER_ADMIN,
        isOtpVerified: true,
      });
      console.log('Super Admin seeded: superadmin@admin.com / admin123');
    } else {
      console.log('ℹ Super Admin already exists');
    }
  } catch (error) {
    console.error('Error during app initialization:', error.message);
  }
  app.enableCors();
  const PORT = 3000;
  await app.listen(PORT);
  console.log(`Server is running at: http://localhost:${PORT}`);
}
bootstrap();
