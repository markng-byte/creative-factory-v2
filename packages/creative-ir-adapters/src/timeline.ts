/**
 * Timeline Adapter.
 *
 * Emits a flat, frame-accurate timeline of scenes and shots with cumulative in/out frames — the
 * edit-decision backbone downstream video assembly and QA rely on.
 */

import type { AdapterCapability, AdapterOptions, CreativeIR } from '@creative-factory/creative-ir';
import { BaseAdapter, eachScene, type BuildResult } from './base.js';
import { durationToFrames } from './support.js';

export class StandardTimelineAdapter extends BaseAdapter {
  readonly name = 'timeline' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'cumulative-frames', level: 'required' },
    { feature: 'scene-and-shot-tracks', level: 'required' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const frameRate = firstFrameRate(creativeIR);
    const sceneTrack: Array<Record<string, unknown>> = [];
    const shotTrack: Array<Record<string, unknown>> = [];
    let cursor = 0;

    for (const { scene } of eachScene(creativeIR)) {
      const sceneFrames = durationToFrames(scene.duration);
      const sceneStart = cursor;
      sceneTrack.push({
        sceneId: scene.id,
        title: scene.title,
        startFrame: sceneStart,
        endFrame: sceneStart + sceneFrames,
        frames: sceneFrames,
      });

      let shotCursor = sceneStart;
      for (const shot of scene.shots) {
        const shotFrames = durationToFrames(shot.duration);
        shotTrack.push({
          shotId: shot.id,
          sceneId: scene.id,
          startFrame: shotCursor,
          endFrame: shotCursor + shotFrames,
          frames: shotFrames,
        });
        shotCursor += shotFrames;
      }

      cursor = sceneStart + sceneFrames;
    }

    const content = this.json({
      creativeIRId: creativeIR.id,
      frameRate,
      totalFrames: cursor,
      totalSeconds: frameRate > 0 ? Number((cursor / frameRate).toFixed(3)) : cursor,
      sceneTrack,
      shotTrack,
    });

    return {
      artifacts: [this.artifact('timeline.json', 'json', content, 'application/json')],
      warnings: [],
      transformRules: ['cumulative-frames', 'scene-and-shot-tracks'],
    };
  }
}

function firstFrameRate(creativeIR: CreativeIR): number {
  const scenes = [...eachScene(creativeIR)];
  const rate = scenes[0]?.scene.duration.frameRate;
  return rate && rate > 0 ? rate : 30;
}
