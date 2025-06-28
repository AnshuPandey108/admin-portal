// src/transactions/dto/create-transaction.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}
