/**
 * Markdown Brand Importer
 *
 * Imports brand guidelines from Markdown format.
 */

import type { BrandPackage, BrandPackageId, BrandComponent } from '@creative-factory/domain';
import { BrandSourceFormat, BrandComponentType } from '@creative-factory/domain';
import type { BrandImporter } from './importer.js';

export class MarkdownBrandImporter implements BrandImporter {
  readonly name = 'markdown-importer';
  readonly version = '1.0.0';
  readonly supportedFormats = ['markdown', 'md', 'text/markdown', 'text/plain'];
  readonly description = 'Imports brand guidelines from Markdown format';

  canHandle(format: string, content: string | Buffer): boolean {
    const fmt = format.toLowerCase();
    if (!this.supportedFormats.includes(fmt)) {
      return false;
    }
    const str = typeof content === 'string' ? content : content.toString();
    return str.includes('#') || str.includes('##') || str.includes('###');
  }

  async import(
    id: BrandPackageId,
    name: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<BrandPackage> {
    try {
      const str = typeof content === 'string' ? content : content.toString();
      const sections = this.parseMarkdown(str);

      return {
        id,
        name,
        version: '1.0.0',
        description: sections.description,
        sourceFormat: BrandSourceFormat.MARKDOWN,
        metadata: metadata ?? {},
        components: sections.components,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to import Markdown brand package: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private parseMarkdown(content: string): { description: string; components: BrandComponent[] } {
    const lines = content.split('\n');
    const description = lines.slice(0, Math.min(5, lines.length)).join('\n').slice(0, 200);

    const components: BrandComponent[] = [];

    // Extract sections
    let currentSection: { type: string; name: string; content: string[] } | null = null;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentSection) {
          components.push({
            type: this.mapSectionToComponentType(currentSection.type),
            name: currentSection.name,
            description: currentSection.content.join('\n'),
            content: { format: 'markdown', data: currentSection.content.join('\n') },
            metadata: {},
          });
        }
        currentSection = {
          type: line.slice(2).toLowerCase(),
          name: line.slice(2),
          content: [],
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      components.push({
        type: this.mapSectionToComponentType(currentSection.type),
        name: currentSection.name,
        description: currentSection.content.join('\n'),
        content: { format: 'markdown', data: currentSection.content.join('\n') },
        metadata: {},
      });
    }

    return { description, components };
  }

  private mapSectionToComponentType(section: string): BrandComponentType {
    const mapping: Record<string, BrandComponentType> = {
      color: BrandComponentType.COLOR_PALETTE,
      typography: BrandComponentType.TYPOGRAPHY,
      logo: BrandComponentType.LOGO,
      icons: BrandComponentType.ICON_LIBRARY,
      illustrations: BrandComponentType.ILLUSTRATION_LIBRARY,
      photography: BrandComponentType.PHOTOGRAPHY_GUIDE,
      motion: BrandComponentType.MOTION_GUIDELINES,
      voice: BrandComponentType.TONE_OF_VOICE,
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (section.includes(key)) {
        return value;
      }
    }

    return BrandComponentType.CUSTOM;
  }
}
