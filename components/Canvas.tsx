/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect } from 'react';
import { SimulationConfig, GlobalSettings, Ball, Vector2 } from '../types';
import { generatePolygon, generateStar, rotatePoint, add, mult, dot, sub, normalize, mag } from '../utils/math';

interface CanvasProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
}

const Canvas: React.FC<CanvasProps> = ({ config, globalSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: Initialize useRef with null and update type to handle null value.
  const requestRef = useRef<number | null>(null);
  const stateRef = useRef<{
    balls: Ball[];
    rotation: number;
  }>({
    balls: [],
    rotation: 0,
  });

  // Initialize Simulation
  useEffect(() => {
    const balls: Ball[] = [];
    const count = Math.floor(config.ballCount * 1); // Could add global multiplier if needed
    
    for (let i = 0; i < count; i++) {
      // Random start position near center to avoid wall clipping immediately
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      const speed = config.initialSpeed * (0.5 + Math.random());
      const velAngle = Math.random() * Math.PI * 2;

      balls.push({
        id: `${config.id}-${i}`,
        pos: { x: 0 + Math.cos(angle) * dist, y: 0 + Math.sin(angle) * dist }, // Relative to center 0,0
        vel: { x: Math.cos(velAngle) * speed, y: Math.sin(velAngle) * speed },
        radius: config.ballSize,
        color: '#FACC15', // Tailwind yellow-400
      });
    }

    stateRef.current = {
      balls,
      rotation: 0,
    };
  }, [config.id, config.ballCount, config.initialSpeed, config.ballSize]);

  const updatePhysics = (width: number, height: number) => {
    const state = stateRef.current;
    const { gravityMultiplier, timeScale, rotationMultiplier, bouncinessMultiplier } = globalSettings;
    
    const center = { x: width / 2, y: height / 2 };
    const shapeRadius = Math.min(width, height) * 0.45; // 45% of canvas size

    // 1. Update Rotation
    state.rotation += config.rotationSpeed * rotationMultiplier * timeScale;

    // 2. Generate Shape Vertices (Local Space)
    let localVertices: Vector2[] = [];
    if (config.shapeType === 'star') {
         localVertices = generateStar(config.vertexCount || 5, shapeRadius, shapeRadius * 0.4, {x:0,y:0}, state.rotation);
    } else {
         localVertices = generatePolygon(config.vertexCount || 4, shapeRadius, {x:0,y:0}, state.rotation);
    }

    // 3. Update Balls
    state.balls.forEach(ball => {
        // Apply Forces & Velocity
        ball.vel.y += config.gravity * gravityMultiplier * timeScale;
        ball.vel = mult(ball.vel, 1 - config.friction * timeScale);
        ball.pos = add(ball.pos, mult(ball.vel, timeScale));

        // Collision with Walls
        const restitution = config.restitution * bouncinessMultiplier;
        
        for (let i = 0; i < localVertices.length; i++) {
            const p1 = localVertices[i];
            const p2 = localVertices[(i + 1) % localVertices.length];
            const edge = sub(p2, p1);
            
            // Calculate normal pointing inward
            const edgeNormal = normalize({ x: -edge.y, y: edge.x }); 
            if (dot(edgeNormal, mult(p1, -1)) < 0) {
                edgeNormal.x *= -1;
                edgeNormal.y *= -1;
            }

            const relPos = sub(ball.pos, p1);
            const dist = dot(relPos, edgeNormal);
            
            if (dist < ball.radius) {
                // Position correction
                const penetration = ball.radius - dist;
                ball.pos = add(ball.pos, mult(edgeNormal, penetration));

                // Reflect Velocity
                const velDotNormal = dot(ball.vel, edgeNormal);
                if (velDotNormal < 0) {
                    const reflect = mult(edgeNormal, 2 * velDotNormal);
                    ball.vel = sub(ball.vel, mult(reflect, 1));
                    ball.vel = mult(ball.vel, restitution);
                    ball.vel = add(ball.vel, mult(edgeNormal, 0.1));
                }
            }
        }
    });

    // 4. Ball-to-Ball Collisions
    const balls = state.balls;
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ballA = balls[i];
            const ballB = balls[j];

            const distVec = sub(ballB.pos, ballA.pos);
            const distance = mag(distVec);
            const totalRadius = ballA.radius + ballB.radius;

            if (distance < totalRadius) {
                // Collision detected
                
                // Position Correction
                const overlap = totalRadius - distance;
                const correctionNormal = distance === 0 ? {x: 1, y: 0} : normalize(distVec);
                const correctionA = mult(correctionNormal, -overlap / 2);
                const correctionB = mult(correctionNormal, overlap / 2);
                ballA.pos = add(ballA.pos, correctionA);
                ballB.pos = add(ballB.pos, correctionB);

                // Velocity Update (elastic collision, assuming equal mass)
                const collisionNormal = normalize(distVec);
                const relativeVelocity = sub(ballB.vel, ballA.vel);
                const speedAlongNormal = dot(relativeVelocity, collisionNormal);

                // Only resolve if balls are moving towards each other
                if (speedAlongNormal < 0) {
                    const v1n_scalar = dot(ballA.vel, collisionNormal);
                    const v2n_scalar = dot(ballB.vel, collisionNormal);

                    const v1n_vec = mult(collisionNormal, v1n_scalar);
                    const v2n_vec = mult(collisionNormal, v2n_scalar);
                    
                    const v1t_vec = sub(ballA.vel, v1n_vec);
                    const v2t_vec = sub(ballB.vel, v2n_vec);

                    // New velocities after swapping normal components
                    ballA.vel = add(v1t_vec, v2n_vec);
                    ballB.vel = add(v2t_vec, v1n_vec);
                }
            }
        }
    }


    // Final check: Hard limit to keep in canvas if it glitches out
    balls.forEach(ball => {
      if (mag(ball.pos) > shapeRadius + 50) {
           ball.pos = {x: 0, y: 0};
           ball.vel = {x: 0, y: 0};
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const center = { x: width / 2, y: height / 2 };
    const state = stateRef.current;
    const shapeRadius = Math.min(width, height) * 0.45;

    // Draw Shape
    let points: Vector2[] = [];
    if (config.shapeType === 'star') {
         points = generateStar(config.vertexCount || 5, shapeRadius, shapeRadius * 0.4, center, state.rotation);
    } else {
         points = generatePolygon(config.vertexCount || 4, shapeRadius, center, state.rotation);
    }

    ctx.beginPath();
    if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
    }
    
    // Style Shape
    ctx.strokeStyle = '#22D3EE'; // cyan-400
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.fill();

    // Draw Balls
    state.balls.forEach(ball => {
        const screenX = center.x + ball.pos.x;
        const screenY = center.y + ball.pos.y;

        ctx.beginPath();
        ctx.arc(screenX, screenY, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
  };

  const tick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    }

    updatePhysics(canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSettings]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default Canvas;