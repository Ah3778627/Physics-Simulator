/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Vector2 } from '../types';

export const add = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const sub = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const mult = (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s });
export const dot = (v1: Vector2, v2: Vector2): number => v1.x * v2.x + v1.y * v2.y;
export const mag = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const normalize = (v: Vector2): Vector2 => {
  const m = mag(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};

export const rotatePoint = (point: Vector2, center: Vector2, angle: number): Vector2 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
};

export const generatePolygon = (sides: number, radius: number, center: Vector2, rotation: number): Vector2[] => {
  const points: Vector2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides + rotation;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
};

export const generateStar = (points: number, outerRadius: number, innerRadius: number, center: Vector2, rotation: number): Vector2[] => {
    const vertices: Vector2[] = [];
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points + rotation;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        vertices.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }
    return vertices;
}

// Distance from point P to line segment AB
export const distPointToSegment = (p: Vector2, a: Vector2, b: Vector2): { dist: number, normal: Vector2, closest: Vector2 } => {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const proj = dot(ap, ab);
  const abLenSq = dot(ab, ab);
  const d = proj / abLenSq;

  let closest: Vector2;
  if (d <= 0) closest = a;
  else if (d >= 1) closest = b;
  else closest = add(a, mult(ab, d));

  const distVec = sub(p, closest);
  const distance = mag(distVec);
  
  // Normal pointing away from the line (towards the inside of the shape typically, if wound CCW)
  // We calculate normal from the line segment AB. 
  // If we traverse A -> B, the normal (-y, x) points to the left.
  let normal = { x: -ab.y, y: ab.x };
  normal = normalize(normal);

  return { dist: distance, normal, closest };
};
