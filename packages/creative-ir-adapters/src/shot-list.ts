/**
 * Shot List Adapter.
 *
 * Emits a flat, ordered shot list — the production-facing breakdown each shot's camera, lens,
 * framing, subject, foreground/background, motion, transition, and timing.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  CreativeIR,
  Shot,
  ShotListAdapter,
} from '@creative-factory/creative-ir';
import { BaseAdapter, eachScene, type BuildResult } from './base.js';
import { durationToFrames, durationToSeconds } from './support.js';

export class StandardShotListAdapter extends BaseAdapter implements ShotListAdapter {
  readonly name = 'shot-list' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'camera-breakdown', level: 'required' },
    { feature: 'frame-accurate-timing', level: 'required' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const rows: Array<Record<string, unknown>> = [];
    let globalIndex = 0;

    for (const { scene } of eachScene(creativeIR)) {
      scene.shots.forEach((shot, shotIndex) => {
        const transition = scene.transitions[shotIndex];
        rows.push(this.shotRow(shot, scene.id, globalIndex, transition?.type));
        globalIndex += 1;
      });
    }

    const content = this.json({
      creativeIRId: creativeIR.id,
      shotCount: rows.length,
      totalFrames: rows.reduce((sum, row) => sum + Number(row['durationFrames'] ?? 0), 0),
      shots: rows,
    });

    return {
      artifacts: [this.artifact('shot-list.json', 'json', content, 'application/json')],
      warnings: rows.length === 0 ? ['No shots were found in the Creative IR'] : [],
      transformRules: ['flatten-shots', 'attach-transition', 'frame-accurate-timing'],
    };
  }

  private shotRow(
    shot: Shot,
    sceneId: string,
    globalIndex: number,
    transition: string | undefined,
  ): Record<string, unknown> {
    const visual = shot.visualSpec;
    const subject = visual.foregroundElements.find((element) => element.type === 'subject');
    const motif = visual.foregroundElements.find((element) => element.type === 'foreground-motif');
    const background = visual.backgroundElements[0];

    return {
      shotId: shot.id,
      globalOrder: globalIndex,
      sceneId,
      cameraType: visual.shotType,
      lens: visual.camera.lens.type,
      cameraMovement: visual.camera.movement,
      framing: visual.composition.subjectPlacement,
      subject: subject?.description ?? shot.description,
      foreground: motif?.description ?? '',
      background: background?.description ?? '',
      motion: shot.motionSpec.cameraMotion.map((keyframe) => keyframe.easing),
      transition: transition ?? 'cut',
      durationSeconds: durationToSeconds(shot.duration),
      durationFrames: durationToFrames(shot.duration),
    };
  }
}
