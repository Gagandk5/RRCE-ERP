import { Module } from '@nestjs/common';
import { PrincipalService } from './principal.service';
import { PrincipalController } from './principal.controller';

@Module({
  providers: [PrincipalService],
  controllers: [PrincipalController],
  exports: [PrincipalService],
})
export class PrincipalModule {}

