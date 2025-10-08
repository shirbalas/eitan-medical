import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { PatientsModule } from './patients/patients.module';
import { HeartRateModule } from './heart-rate/heart-rate.module';
import { SeederService } from './seed/seeder.service';
import { AppController } from './app.controller';
import { PatientRequestTrackerMiddleware } from './common/middleware/request-tracker.middleware';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore:
                    'pid,hostname,req.headers,req.remoteAddress,req.remotePort,res.headers',
                },
              }
            : undefined,

        genReqId(req, res) {
          const existing =
            (req.headers['x-request-id'] as string) || (req as any).id;
          const id = existing || randomUUID();
          (req as any).id = id;
          return id;
        },

        customProps(req) {
          return {
            requestId: (req as any).id,
            userAgent: req.headers['user-agent'],
          };
        },

        redact: ['req.headers.authorization'],

        autoLogging: true,
      },
    }),

    PatientsModule,
    HeartRateModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PatientRequestTrackerMiddleware)
      .forRoutes(
        { path: 'patients/:id', method: RequestMethod.ALL },
        { path: 'patients/:id/(.*)', method: RequestMethod.ALL },
      );
  }
}
