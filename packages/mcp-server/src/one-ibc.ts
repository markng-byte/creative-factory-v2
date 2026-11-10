/**
 * One IBC profile (CF_PROFILE=one-ibc): a provisional brief and campaign for One IBC, used until the real
 * ones are entered in the Google Sheet. The brand itself is the plugin in plugins/brands/one-ibc, which
 * follows the Growth Workspace spec, section 7: background #F0F0F2, red #8B0000 about 10% of the frame,
 * Hook + first sentence under 125 characters, headline at most 40, description at most 30.
 *
 * Anything the spec does not fix is labelled "Tạm" (provisional): tone of voice, audience, logo.
 * The call to action is "Nhắn One IBC qua WhatsApp" and never carries a real phone number.
 */
import { exampleCampaign, exampleCreativeBrief } from '@creative-factory/creative-ir-compiler';

export const ONE_IBC_IDS = {
  briefId: 'brief-one-ibc-tam',
  campaignId: 'campaign-one-ibc-tam',
  brandId: 'brand-one-ibc',
} as const;

export const ONE_IBC_CTA = 'Nhắn One IBC qua WhatsApp';

/** Spec section 7 copy limits, also written into the brief as blocking constraints. */
export const ONE_IBC_COPY_LIMITS = {
  hookFirstSentenceMaxChars: 124,
  headlineMaxChars: 40,
  descriptionMaxChars: 30,
} as const;

type Brief = ReturnType<typeof exampleCreativeBrief>;
type Campaign = ReturnType<typeof exampleCampaign>;

export function oneIbcBrief(): Brief {
  const base = exampleCreativeBrief();
  const [core, value, proof] = base.keyMessages;
  return {
    ...base,
    id: ONE_IBC_IDS.briefId as Brief['id'],
    campaignId: ONE_IBC_IDS.campaignId,
    brandProfileId: ONE_IBC_IDS.brandId,
    version: '0.1.0-tam',
    campaignContext: {
      ...base.campaignContext,
      name: 'One IBC: lập công ty theo Hook tuần (Tạm)',
      goal: 'Khách nhắn One IBC qua WhatsApp để hỏi lập công ty ở tài phán đã chốt giá',
      background:
        'Chủ doanh nghiệp cần lập công ty ở nước ngoài và mở tài khoản, muốn biết rõ thời gian và giá.',
      competitiveContext: 'Đối thủ báo giá không rõ phần phí năm sau.',
      marketOpportunity: 'Khách chọn đơn vị báo rõ tài phán, thời gian và giá ngay từ đầu.',
    },
    keyMessages: [
      { ...core!, content: 'Lập công ty đúng tài phán, rõ thời gian và giá' },
      { ...value!, content: 'Một đội hỗ trợ từ lập công ty tới mở tài khoản' },
      { ...proof!, content: 'Báo giá ghi rõ phí năm đầu và phí gia hạn' },
    ],
    messagingFramework: {
      ...base.messagingFramework,
      bigIdea: 'Rõ tài phán, rõ thời gian, rõ giá',
      messagingPillars: [
        {
          id: 'pillar-clear',
          title: 'Rõ ràng',
          description: 'Nói tài phán, thời gian, giá',
          messages: [],
        },
      ],
      narrativeArc: 'Từ băn khoăn về thủ tục và chi phí tới một bước tiếp theo rõ ràng',
      storyHooks: [],
      consistencyGuidelines: [
        'Mỗi khung hình một thông điệp',
        'Không dùng từ trong danh sách cấm của brand',
      ],
    },
    toneOfVoice: {
      ...base.toneOfVoice,
      personality: ['rõ ràng', 'đáng tin', 'thực tế'],
      traits: ['cụ thể (Tạm)'],
      doExamples: ['Nêu tài phán, số ngày, giá (Tạm)'],
      dontExamples: ['Hứa hẹn về thuế (Tạm)'],
      voiceAttributes: [
        { spectrum: 'Formal to Casual', position: 2, description: 'Chuyên viên dễ hiểu (Tạm)' },
      ],
    },
    emotionalDirection: {
      ...base.emotionalDirection,
      primaryEmotion: 'yên tâm',
      secondaryEmotions: ['tin tưởng'],
      emotionalJourney: [
        { phase: 'open', emotion: 'băn khoăn', intensity: 5, trigger: 'thủ tục và chi phí' },
        { phase: 'peak', emotion: 'yên tâm', intensity: 8, trigger: 'giá và thời gian rõ ràng' },
        { phase: 'close', emotion: 'sẵn sàng', intensity: 7, trigger: ONE_IBC_CTA },
      ],
      avoidEmotions: ['sợ hãi', 'vội vàng'],
    },
    visualDirection: {
      ...base.visualDirection,
      visualConcept: 'Nền sáng #F0F0F2, điểm nhấn đỏ #8B0000 khoảng 10% khung hình',
      visualThemes: ['giấy tờ, phê duyệt', 'người làm việc thật'],
      colorMood: 'sáng, gọn',
      aestheticStyle: 'phẳng, một thông điệp mỗi khung',
      visualReferences: [],
      prohibitedVisuals: ['tiền mặt chất đống', 'hình ảnh xa hoa hay bí mật'],
    },
    desiredUserAction: {
      primary: {
        description: ONE_IBC_CTA,
        verb: 'Nhắn',
        object: 'One IBC qua WhatsApp',
        measurement: 'contact_captured',
      },
      conversionFunnel: [
        { stage: 'awareness', action: 'xem quảng cáo' },
        { stage: 'intent', action: ONE_IBC_CTA },
      ],
    },
    successMetrics: [
      {
        id: 'metric-contact',
        category: 'business',
        name: 'contact_captured',
        description: 'Liên hệ WhatsApp có contact_id',
        priority: 'primary',
      },
    ],
    creativeConstraints: [
      {
        ...base.creativeConstraints[0]!,
        description: `Hook + câu 1 dưới ${ONE_IBC_COPY_LIMITS.hookFirstSentenceMaxChars + 1} ký tự; Headline tối đa ${ONE_IBC_COPY_LIMITS.headlineMaxChars}; Description tối đa ${ONE_IBC_COPY_LIMITS.descriptionMaxChars}`,
        rationale: 'Growth Workspace spec mục 7',
        impact: 'blocking',
      },
      {
        ...base.creativeConstraints[0]!,
        description: 'Nền #F0F0F2; đỏ #8B0000 khoảng 10% khung hình',
        rationale: 'Growth Workspace spec mục 7',
        impact: 'blocking',
      },
      {
        ...base.creativeConstraints[0]!,
        description: 'Không ghi số điện thoại trong CTA',
        rationale: 'Số WhatsApp thật do Team MKT gắn khi đăng',
        impact: 'blocking',
      },
    ],
    brandReferences: [
      { element: 'colors', requirement: 'Nền #F0F0F2; đỏ #8B0000 khoảng 10%' },
      { element: 'logo', requirement: 'Chưa có bộ logo (Tạm)' },
    ],
    priorityMatrix: {
      mustHave: ['quảng cáo 9:16 và 16:9'],
      shouldHave: [],
      couldHave: [],
      wontHave: ['in ấn'],
      tradeoffs: [],
    },
  };
}

export function oneIbcCampaign(): Campaign {
  const base = exampleCampaign();
  return {
    ...base,
    id: ONE_IBC_IDS.campaignId,
    name: 'One IBC Hook tuần (Tạm)',
    description: 'Chiến dịch tạm cho Storyboard từ Hook của Growth Workspace',
    objective: 'Khách nhắn One IBC qua WhatsApp',
    targetAudience: {
      demographics: [{ age: { min: 25, max: 55 } }],
      psychographics: ['rõ ràng', 'nhanh (Tạm)'],
      mediaPreferences: ['Facebook', 'YouTube'],
      geographies: ['VN'],
    },
    languages: ['vi'],
    marketRegions: ['VN'],
  };
}
