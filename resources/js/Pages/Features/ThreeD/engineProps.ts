import type { Scene } from "@particle-academy/fancy-3d";

/** What both WebGL renderers take: the scene, read-only, and a camera angle. */
export type EngineSceneProps = {
    scene: Scene;
    /** Horizontal camera angle in radians; undefined keeps the adapter's default. */
    cameraAlpha?: number;
};
