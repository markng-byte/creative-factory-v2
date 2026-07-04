/**
 * Scene Specification Adapter.
 *
 * Emits a complete, machine-readable scene specification per scene — the document downstream
 * art-direction and QA engines consume. Every field is read from the Creative IR; nothing is
 * invented here.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  CreativeIR,
  Scene,
  SceneSpecificationAdapter,
} from '@creative-factory/creative-ir';
import { BaseAdapter, eachScene, type BuildResult } from './base.js';
import { durationToSeconds } from './support.js';

export class StandardSceneSpecAdapter extends BaseAdapter implements SceneSpecificationAdapter {
  readonly name = 'scene-spec' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'scene-objectives', level: 'required' },
    { feature: 'camera-direction', level: 'required' },
    { feature: 'brand-token-tracing', level: 'optional' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const brandColors = [
      ...creativeIR.brandTokens.primaryColors,
      ...creativeIR.brandTokens.secondaryColors,
      ...creativeIR.brandTokens.accentColors,
    ].map((token) => token.hex);

    const typographyRules = creativeIR.brandTokens.typography.map((token) => ({
      name: token.name,
      fontFamily: token.fontFamily,
      usage: token.usage,
    }));

    const specs = [...eachScene(creativeIR)].map(({ scene }, index, all) => {
      const previous = index > 0 ? all[index - 1]?.scene : undefined;
      return this.sceneSpec(scene, previous, brandColors, typographyRules);
    });

    const content = this.json({
      creativeIRId: creativeIR.id,
      schemaVersion: creativeIR.version,
      sceneCount: specs.length,
      scenes: specs,
    });

    return {
      artifacts: [this.artifact('scene-specifications.json', 'json', content, 'application/json')],
      warnings: specs.length === 0 ? ['No scenes were found in the Creative IR'] : [],
      transformRules: ['scene-objectives', 'first-shot-camera-direction', 'brand-token-tracing'],
    };
  }

  private sceneSpec(
    scene: Scene,
    previous: Scene | undefined,
    brandColors: string[],
    typographyRules: Array<{ name: string; fontFamily: string; usage: string }>,
  ): Record<string, unknown> {
    const lead = scene.shots[0];
    const visual = lead?.visualSpec;

    return {
      sceneId: scene.id,
      title: scene.title,
      sequence: scene.sequence,
      purpose: scene.objectives?.purpose ?? scene.description ?? '',
      narrativeGoal: scene.objectives?.narrativeGoal ?? '',
      businessGoal: scene.objectives?.businessGoal ?? '',
      audienceImpact: scene.objectives?.audienceImpact ?? '',
      emotion: scene.objectives?.emotion ?? scene.audioSpecs.voiceover?.emotionalTone ?? '',
      durationSeconds: durationToSeconds(scene.duration),
      cameraDirection: visual
        ? {
            shotType: visual.shotType,
            movement: visual.camera.movement,
            lens: visual.camera.lens.type,
            focus: visual.camera.focus.type,
          }
        : null,
      composition: visual?.composition ?? null,
      lighting: visual
        ? { type: visual.lighting.type, mood: visual.lighting.mood, keyColor: visual.lighting.keyLight.color }
        : null,
      motionDirection: lead?.motionSpec.cameraMotion.map((keyframe) => ({
        time: keyframe.time,
        easing: keyframe.easing,
      })),
      visualComponents: [
        ...(visual?.foregroundElements ?? []).map((element) => element.description),
        ...(visual?.backgroundElements ?? []).map((element) => element.description),
      ],
      typographyRules,
      brandTokensUsed: brandColors,
      requiredAssets: scene.shots.flatMap((shot) => shot.assetRequests),
      dependencies: previous ? [previous.id] : [],
    };
  }
}
