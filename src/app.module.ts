import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

   TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
 useFactory: (config: ConfigService) => {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST'),
    port: parseInt(config.get<string>('DB_PORT') ?? '5432'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  };
}

}),

   UsersModule

    // We'll build this module next
  ],
  controllers: [AppController], // 👈 Add this
  providers: [AppService],     // 👈 Add this
})
export class AppModule {}
