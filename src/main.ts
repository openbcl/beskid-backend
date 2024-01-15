import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('BESKID API')
    .setDescription(
      `<b>BESKID: BEmessungsbrandsimulationen in Schienenfahrzeugen mittels KI-basierter Daten</b><br>
      Project page: <a href="https://www.beskid-projekt.de/en">https://www.beskid-projekt.de/en</a>`,
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
