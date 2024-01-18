import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('BESKID API')
    .setContact(
      'Robert Weiße | Brandschutz Consult Ingenieurgesellschaft mbH Leipzig',
      'https://www.bcl-leipzig.de',
      'it@bcl-leipzig.de',
    )
    .setDescription(
      `<i>At the moment this API is only intended for test purposes. Results of calculated tasks will only provide random data!</i><br>
      <i>This API will be available for productive use as soon as the <a href="https://www.beskid-projekt.de/en/projekt/modellierung">modeling project phase</a> has been successfully completed.</i>
      <p align="right">
        <a href="https://www.beskid-projekt.de/en">Project page</a>,
        <a href="https://github.com/openbcl/beskid-backend">GitHub</a>,
        <a href="https://www.beskid-projekt.de/en/impressum-und-haftungsausschluss">Legal Notice</a>,
        <a href="https://www.beskid-projekt.de/en/kontakt">Contact</a>
      </p>
      <img src="https://www.beskid-projekt.de/@@project-logo/Logo_text_500px.png" alt="BESKID Logo"/><br>
      <br>
      <b>BEmessungsbrandsimulationen in Schienenfahrzeugen mittels KI-basierter Daten</b>`,
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
