import { Global, Module } from '@nestjs/common';
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { PrometheusService } from 'common/prometheus';
import { ConfigService } from 'common/config';
@Global()
@Module({
  imports: [
    FallbackProviderModule.forRootAsync({
      async useFactory(configService: ConfigService, prometheusService: PrometheusService) {
        return {
          urls: configService.get('PROVIDERS_URLS'),
          network: configService.get('CHAIN_ID'),
          fetchMiddlewares: [
            async (next) => {
              const endTimer = prometheusService.elRpcRequestDuration.startTimer();
              try {
                return await next();
              } catch (error) {
                prometheusService.elRpcErrors.inc();
                throw error;
              } finally {
                endTimer();
              }
            },
          ],
        };
      },
      inject: [ConfigService, PrometheusService],
    }),
  ],
})
export class ProviderModule {}