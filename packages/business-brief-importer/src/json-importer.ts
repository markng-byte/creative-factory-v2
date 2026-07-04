import type {
  BusinessBriefInput,
  CompetitiveLandscape,
  BudgetBreakdown,
  Milestone,
  AssetRequirement,
  ExistingAsset,
  CreativeReference,
  ComplianceRequirement,
  SuccessMetric,
} from '@creative-factory/domain';
import type { BusinessBriefImporter, BusinessBriefImportResult } from './importer.js';

/**
 * JSON Business Brief Importer
 * Handles JSON format business briefs
 */
export class JSONBusinessBriefImporter implements BusinessBriefImporter {
  readonly format = 'json';

  async import(
    id: string,
    content: string | object,
    _metadata?: Record<string, unknown>,
  ): Promise<BusinessBriefImportResult> {
    const startTime = Date.now();
    const warnings: Array<{ field?: string; message: string }> = [];

    try {
      let brief: unknown;

      if (typeof content === 'string') {
        try {
          brief = JSON.parse(content);
        } catch (e) {
          return {
            success: false,
            errors: [
              {
                message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
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
      } else {
        brief = content;
      }

      if (!brief || typeof brief !== 'object') {
        return {
          success: false,
          errors: [{ message: 'Content is not a valid object', severity: 'critical' }],
          warnings: [],
          metadata: {
            importedAt: new Date().toISOString(),
            importer: this.format,
            importTime: Date.now() - startTime,
            fieldsProcessed: 0,
          },
        };
      }

      const briefInput = this.validateAndNormalize(brief as Record<string, unknown>);

      if (this.hasRequiredFields(briefInput)) {
        return {
          success: true,
          briefId: id,
          brief: briefInput,
          errors: [],
          warnings,
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
        warnings,
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
            message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
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
      customerPersonas: (content.customerPersonas as BusinessBriefInput['customerPersonas']) || [],
      market: {
        primaryMarket: (marketData.primaryMarket as string) || 'Global',
        secondaryMarkets: (marketData.secondaryMarkets as string[]) || [],
        marketSize: (marketData.marketSize as string) || undefined,
        marketTrends: (marketData.marketTrends as string[]) || [],
        competitiveLandscape: {
          directCompetitors:
            (marketData.directCompetitors as CompetitiveLandscape['directCompetitors']) || [],
          indirectCompetitors:
            (marketData.indirectCompetitors as CompetitiveLandscape['indirectCompetitors']) || [],
          marketLeaders: (marketData.marketLeaders as string[]) || [],
          differentiators: (marketData.differentiators as string[]) || [],
        },
        regulatoryEnvironment: (marketData.regulatoryEnvironment as string[]) || [],
      },
      industry: (content.industry as string) || '',
      productsServices: (content.productsServices as BusinessBriefInput['productsServices']) || [],
      valueProposition: (content.valueProposition as string) || '',
      competitivePositioning: (content.competitivePositioning as string) || '',
      campaignType: (campaignTypeValue as BusinessBriefInput['campaignType']) || 'custom',
      communicationChannels:
        (content.communicationChannels as BusinessBriefInput['communicationChannels']) || [],
      languages: (content.languages as string[]) || ['en'],
      regions: (content.regions as string[]) || [],
      budget: budgetData
        ? {
            total: (budgetData.total as number) || 0,
            currency: (budgetData.currency as string) || 'USD',
            breakdown: (budgetData.breakdown as BudgetBreakdown[]) || undefined,
            flexibility: (budgetData.flexibility as 'fixed' | 'flexible' | 'range') || undefined,
          }
        : undefined,
      timeline: {
        startDate: (timelineData.startDate as string) || new Date().toISOString().slice(0, 10),
        endDate: (timelineData.endDate as string) || undefined,
        milestones: (timelineData.milestones as Milestone[]) || [],
      },
      assetRequirements: (content.assetRequirements as AssetRequirement[]) || [],
      existingAssets: (content.existingAssets as ExistingAsset[]) || undefined,
      creativeReferences: (content.creativeReferences as CreativeReference[]) || undefined,
      businessConstraints: (content.businessConstraints as string[]) || [],
      complianceRequirements: (content.complianceRequirements as ComplianceRequirement[]) || [],
      successMetrics: (content.successMetrics as SuccessMetric[]) || [],
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
