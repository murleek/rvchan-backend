import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export class TemplateService {
  private readonly templatesDir = path.join(process.cwd(), 'templates');

  async render(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

    const source = await fs.readFile(templatePath, 'utf-8');

    const template = Handlebars.compile(source);

    return template(context);
  }
}
