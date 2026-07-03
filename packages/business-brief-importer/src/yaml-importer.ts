import * as YAML from 'js-yaml';
import type { BusinessBriefInput } from '@creative-factory/domain';
import type { BusinessBriefImporter, BusinessBriefImportResult } from './importer.js';

/**
 * YAML Business Brief Importer
 * Handles YAML format business briefs
 */
export class YAMLBusinessBriefImporter implements BusinessBriefImporter {
  readonly format = 'yaml';

  async import(
    id: string,
    content: string,
    _metadata?: Record<string, unknown>,
  ): Promise<BusinessBriefImportResult> {
    const startTime = Date.now();

    try {
      if (typeof content !== 'string') {
        return {
          success: false,
          errors: [{ message: 'YAML importer requires string content', severity: 'critical' }],
          warnings: [],
          metadata: {
            importedAt: new Date().toISOString(),
            importer: this.format,
            importTime: Date.now() - startTime,
            fieldsProcessed: 0,
          },
        };
      }

      const parsed = YAML.load(content);

      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          errors: [{ message: 'YAML content is not a valid object', severity: 'critical' }],
          warnings: [],
          metadata: {
            importedAt: new Date().toISOString(),
            importer: this.format,
            importTime: Date.now() - startTime,
            fieldsProcessed: 0,
          },
        };
      }

      const briefInput = this.validateAndNormalize(parsed as Record<string, unknown>);

      if (this.hasRequiredFields(briefInput)) {
        return {
          success: true,
          briefId: id,
          brief: briefInput,
          errors: [],
          warnings: [],
          metadata: {
            importedAt: new Date().toISOString(),
            importer: this.format,
            importTime: Date.now() - startTime,
            fieldsProcessed: Object.keys(briefInput).length,
          },
        };
      }

      return {
        success: false,
        errors: [
          {
            message: 'Missing required fields for business brief',
            severity: 'critical',
          },
        ],
        warnings: [],
        metadata: {
          importedAt: new Date().toISOString(),
          importer: this.format,
          importTime: Date.now() - startTime,
          fieldsProcessed: Object.keys(briefInput).length,
        },
      };
    } catch (e) {
      return {
        success: false,
        errors: [
          {
            message: `YAML parse error: ${e instanceof Error ? e.message : 'Unknown error'}`,
            severity: 'critical',
          },
        ],
        warnings: [],
        metadata: {
          importedAt: new Date().toISOString(),
          importer: this.format,
          importTime: Date.now() - startTime,
          fieldsProcessed: 0,
        },
      };
    }
  }

  private validateAndNormalize(content: Record<string, unknown>): BusinessBriefInput {
    const targetAudienceData = (content.targetAudience as Record<string, unknown>) || {};
    const marketData = (content.market as Record<string, unknown>) || {};
    const budgetData = (content.budget as Record<string, unknown>) || undefined;
    const timelineData = (content.timeline as Record<string, unknown>) || {};
    const campaignTypeValue = (content.campaignType as string) || 'custom';

    return {
      id: (content.id as string) || '',
      campaignGoal: (content.campaignGoal as string) || '',
      brandProfileId: (content.brandProfileId as string) || undefined,
      targetAudience: {
        description: (targetAudienceData.description as string) || 'Target audience',
        demographics: (targetAudienceData.demographics as any) || undefined,
        psychographics: (targetAudienceData.psychographics as any) || undefined,
        behaviors: (targetAudienceData.behaviors as any) || undefined,
        geographics: (targetAudienceData.geographics as any) || undefined,
        segmentCriteria: (targetAudienceData.segmentCriteria as string[]) || [],
      },
      customerPersonas: ((content.customerPersonas as unknown[]) || []).map((p) => ({
        ...p,
      })) as any,
      market: {
        primaryMarket: (marketData.primaryMarket as string) || 'Global',
        secondaryMarkets: (marketData.secondaryMarkets as string[]) || [],
        marketSize: (marketData.marketSize as string) || undefined,
        marketTrends: (marketData.marketTrends as string[]) || [],
        competitiveLandscape: {
          directCompetitors: ((marketData.directCompetitors as unknown[]) || []).map((c) => ({
            ...c,
          })) as any,
          indirectCompetitors: ((marketData.indirectCompetitors as unknown[]) || []).map((c) => ({
            ...c,
          })) as any,
          marketLeaders: (marketData.marketLeaders as string[]) || [],
          differentiators: (marketData.differentiators as string[]) || [],
        },
        regulatoryEnvironment: (marketData.regulatoryEnvironment as string[]) || [],
      },
      industry: (content.industry as string) || '',
      productsServices: ((content.productsServices as unknown[]) || []).map((p) => ({
        ...p,
      })) as any,
      valueProposition: (content.valueProposition as string) || '',
      competitivePositioning: (content.competitivePositioning as string) || '',
      campaignType: (campaignTypeValue as any) || 'custom',
      communicationChannels: ((content.communicationChannels as unknown[]) || []).map((c) => (c as any)),
      languages: (content.languages as string[]) || ['en'],
      regions: (content.regions as string[]) || [],
      budget: budgetData
        ? {
            total: (budgetData.total as number) || 0,
            currency: (budgetData.currency as string) || 'USD',
            allocation: (budgetData.allocation as Record<string, number>) || {},
            contingency: (budgetData.contingency as number) || 0,
          }
        : undefined,
      timeline: {
        startDate: (timelineData.startDate as string) || new Date().toISOString().split('T')[0],
        endDate: (timelineData.endDate as string) || undefined,
        milestones: ((timelineData.milestones as unknown[]) || []).map((m) => ({
          ...m,
        })) as any,
      },
      assetRequirements: ((content.assetRequirements as unknown[]) || []).map((a) => ({
        ...a,
      })) as any,
      existingAssets: ((content.existingAssets as unknown[]) || []).map((a) => ({
        ...a,
      })) as any,
      creativeReferences: ((content.creativeReferences as unknown[]) || []).map((r) => ({
        ...r,
      })) as any,
      businessConstraints: (content.businessConstraints as string[]) || [],
      complianceRequirements: ((content.complianceRequirements as unknown[]) || []).map((c) => ({
        ...c,
      })) as any,
      successMetrics: ((content.successMetrics as unknown[]) || []).map((m) => ({
        ...m,
      })) as any,
      metadata: (content.metadata as Record<string, unknown>) || {},
    };
  }

  private hasRequiredFields(brief: BusinessBriefInput): boolean {
    return Boolean(
      brief.id &&
        brief.campaignGoal &&
        brief.targetAudience &&
        brief.industry &&
        brief.valueProposition,
    );
  }
}
