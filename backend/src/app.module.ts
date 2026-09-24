import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
import { HodModule } from './hod/hod.module';
import { PrincipalModule } from './principal/principal.module';
import { FacultyModule } from './faculty/faculty.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    AdmissionsModule,
    TimetableModule,
    AttendanceModule,
    HodModule,
    PrincipalModule,
    FacultyModule,
    StudentModule,
  ],
})
export class AppModule { }

