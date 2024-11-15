import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('BESKID API')
    .setContact('BESKID Project page', 'https://www.beskid-projekt.de/en', null)
    .setDescription(
      `<i>At the moment this API is only intended for test purposes. Results of calculated tasks will only provide random data!</i><br>
      <i>This API will be available for productive use as soon as the <a href="https://www.beskid-projekt.de/en/projekt/modellierung">modeling project phase</a> has been successfully completed.</i>
      <p align="right">
      <a href="/legal-notice">Legal Notice</a>,
      <a href="/data-protection">Data Protection</a>,
      <a href="/contact">Contact</a>,
      <a href="https://github.com/openbcl/beskid-backend">GitHub</a>
      </p>
      <img src="https://www.beskid-projekt.de/@@project-logo/Logo_text_500px.png" alt="BESKID Logo"/><br>
      <br>
      <b>BE</b>messungsbrandsimulationen in <b>S</b>chienenfahrzeugen mittels <b>KI</b>-basierter <b>D</b>aten
      <p>Design fire simulation in railway vehicles using AI-based data</p>`,
    )
    .setVersion('DEV 1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: (a: any, b: any) => (a === 'Authentication' ? -1 : a - b),
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'BESKID API',
    customCss: `
      .renderedMarkdown {
        a {
          -webkit-text-decoration: none;
          text-decoration: none;
        }
        i {
          color: red;
          a {
            color: orange !important;
          }
        }
        img {
          width: 25%;
          mix-blend-mode: multiply;
        }
      }
      .swagger-ui .topbar { display: none }
    `,
  });

  await app.listen(3000);
}
bootstrap();
