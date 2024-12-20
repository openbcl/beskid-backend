import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Info } from './config';

@ApiTags('App')
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiExcludeEndpoint()
  @Get()
  @Redirect('api', 301)
  redirectToSwaggerUI() {}

  @Get('info')
  @ApiResponse({
    type: Info,
    status: 200,
    description: 'Request a additional information about the backend',
  })
  info() {
    return this.appService.info()
  }

  @ApiExcludeEndpoint()
  @Get('data-protection')
  dataProtection() {
    return `
      <h1>Data protection</h1>
      <h2>Logging</h2>
      For each request of the web application to its REST-API backend,
      data about this process is stored in a log file. These data are not personally identifiable,
      so we cannot trace which user accessed which data. Therefore,
      no individual user profiles can be created. The stored data is only evaluated for bugtracing purposes.
      In the event of such access, no data is passed on to third parties.
      Log data is overwritten each time the server application is restarted.

      <h2>User data</h2>
      <p>
        During the first loading of this page a UUID v4
        (<a href="https://www.rfc-editor.org/rfc/rfc4122.txt" target="_blank">RFC 4122</a>) is created.
        The UUID is generated using a cryptographic pseudorandom number generator.
        This is necessary to differentiate between the sessions of different users.
      </p>
      <p>
        A session is valid for 7 days. If the website is not reloaded within this time,
        the session is not automatically extended for a further 7 days.
        At the end of this period, the session and all data associated with it,
        such as tasks and their results, will be irrevocably deleted.
      </p>
      <p>
        Results that were previously evaluated by the user for future AI training and released for scientific use will not be deleted.
        However, these can no longer be accessed by the user after the session has expired,
        as previous session data cannot be linked to the new generated session.
      </p>
    `;
  }

  @ApiExcludeEndpoint()
  @Get('legal-notice')
  legalNotice() {
    return `
      <h1>Legal notice</h1>
      The BESKID project is funded by the Federal Ministry of Education and Research (BMBF) within the program "Research for Civil Security".

      <h2>Contact</h2>
      Brandschutz Consult Ingenieurgesellschaft mbH Leipzig<br>
      <a href= "mailto:info@bcl-leipzig.de">Manuel Osburg</a><br>
      Torgauer Platz 3<br>
      04315 Leipzig<br>
      <p>Tel: +49 341 269330</p>
      
      <h2>Disclaimer</h2>
      <h3>Content of the own pages</h3>
      We have carefully compiled the website of the BESKID project.
      However, we do not guarantee or accept liability for the timeliness, 
      completeness, and accuracy of the information provided.

      <h3>Links to external websites</h3>
      The website of the research center contains links to third-party websites.
      These links to third-party websites do not imply endorsement of their content.
      The respective provider or operator of the linked pages is solely responsible for their content.
      Unlawful content was not apparent at the time of linking.
      We do not guarantee the continuous timeliness, accuracy,
      and completeness of the linked content as it lies outside our area of responsibility,
      and we have no influence on its future design. If we become aware of any infringements,
      we will promptly remove such links.
    `;
  }

  @ApiExcludeEndpoint()
  @Get('contact')
  contact() {
    return `
      <h1>Contact</h1>
      <h2>Consortium Coordinator</h2>
      <a href="http://www.fz-juelich.de/profile/arnold_l" target="_blank">Prof. Dr. Lukas Arnold</a><br>
      Forschungszentrum Jülich GmbH<br>
      Institute for Advanced Simulation (IAS)<br>
      IAS-7: Zivile Sicherheitsforschung<br>
      Wilhelm-Johnen Straße<br>
      52425 Jülich<br>

      <h2>Consortium Partners</h2>
      A list of all consortium partners can be found <a href="https://www.beskid-projekt.de/en/partner" target="_blank">here</a>.

      <h2>Web-Developer</h2>
      <a href= "mailto:info@bcl-leipzig.de">Robert Weiße</a><br>
      Brandschutz Consult Ingenieurgesellschaft mbH Leipzig<br>
      Torgauer Platz 3<br>
      04315 Leipzig<br>
    `;
  }
}
