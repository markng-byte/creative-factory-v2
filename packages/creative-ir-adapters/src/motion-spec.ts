/**
 * Motion Specification Adapter.
 *
 * Emits per-shot motion specifications (camera keyframes, object motions, particle effects) that
 * downstream animation and video-generation engines consume.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  CreativeIR,
  MotionSpecAdapter,
} from '@creative-factory/creative-ir';
import { BaseAdapter, eachScene, type BuildResult } from './base.js';
import { durationToFrames } from './support.js';

export class StandardMotionSpecAdapter extends BaseAdapter implements MotionSpecAdapter {
  readonly name = 'motion-spec' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'camera-keyframes', level: 'required' },
    { feature: 'object-motion', level: 'optional' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const motions: Array<Record<string, unknown>> = [];

    for (const { scene } of eachScene(creativeIR)) {
      for (const shot of scene.shots) {
        motions.push({
          shotId: shot.id,
          sceneId: scene.id,
          durationFrames: durationToFrames(shot.duration),
          cameraMotion: shot.motionSpec.cameraMotion,
          objectMotions: shot.motionSpec.objectMotions,
          particleEffects: shot.motionSpec.particleEffects,
          dynamicsSimulation: shot.motionSpec.dynamicsSimulation ?? null,
        });
      }
    }

    const content = this.json({
      creativeIRId: creativeIR.id,
      shotCount: motions.length,
      motions,
    });

    return {
      artifacts: [this.artifact('motion-spec.json', 'json', content, 'application/json')],
      warnings: [],
      transformRules: ['per-shot-motion', 'normalized-keyframe-times'],
    };
  }
}
