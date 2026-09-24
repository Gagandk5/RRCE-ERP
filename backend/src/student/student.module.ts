import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AttendanceModule],
  providers: [StudentService],
  controllers: [StudentController],
  exports: [StudentService],
})
export class StudentModule {}

