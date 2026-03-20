"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { InjuryContext } from "@/types/index";

/**
 * SVG-based body map showing injury locations with pain-level coloring.
 *
 * Colors by pain level:
 *   0-2: green (low/no pain)
 *   3-5: yellow (moderate)
 *   6-10: red (high pain)
 */

interface InjuryBodyMapProps {
  injuryContext: InjuryContext;
}

function painColor(painLevel: number): string {
  if (painLevel <= 2) return "#22c55e"; // green-500
  if (painLevel <= 5) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

function painBgClass(painLevel: number): string {
  if (painLevel <= 2) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
  if (painLevel <= 5) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
}

export function InjuryBodyMap({ injuryContext }: InjuryBodyMapProps) {
  const injuries = [
    {
      key: "shoulder",
      label: "L. Shoulder",
      pain: injuryContext.shoulderInstability.painLevel,
      stage: injuryContext.shoulderInstability.stage,
      href: "/rehab/shoulder-instability",
      cx: 72,
      cy: 58,
    },
    {
      key: "elbow",
      label: "L. Elbow",
      pain: injuryContext.sprainedElbow.painLevel,
      stage: injuryContext.sprainedElbow.stage,
      href: "/rehab/sprained-elbow",
      cx: 58,
      cy: 100,
    },
    {
      key: "foot",
      label: "R. Foot",
      pain: injuryContext.plantarFasciitis.painLevel,
      stage: injuryContext.plantarFasciitis.stage,
      href: "/rehab/plantar-fasciitis",
      cx: 138,
      cy: 210,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Injury Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* SVG Body Silhouette */}
          <svg viewBox="0 0 200 240" className="w-36 h-auto flex-shrink-0" aria-label="Body injury map">
            {/* Simple body silhouette */}
            {/* Head */}
            <circle cx="100" cy="22" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            {/* Torso */}
            <line x1="100" y1="38" x2="100" y2="120" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            {/* Arms */}
            <line x1="100" y1="55" x2="60" y2="105" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            <line x1="100" y1="55" x2="140" y2="105" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            {/* Legs */}
            <line x1="100" y1="120" x2="75" y2="195" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            <line x1="100" y1="120" x2="125" y2="195" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            {/* Feet */}
            <line x1="75" y1="195" x2="65" y2="210" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />
            <line x1="125" y1="195" x2="135" y2="210" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-500" />

            {/* Injury markers */}
            {injuries.map((inj) => (
              <g key={inj.key}>
                <circle
                  cx={inj.cx}
                  cy={inj.cy}
                  r="10"
                  fill={painColor(inj.pain)}
                  fillOpacity="0.3"
                  stroke={painColor(inj.pain)}
                  strokeWidth="2"
                />
                <circle
                  cx={inj.cx}
                  cy={inj.cy}
                  r="4"
                  fill={painColor(inj.pain)}
                />
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-sm">
            {injuries.map((inj) => (
              <Link
                key={inj.key}
                href={inj.href}
                className={`px-2 py-1 rounded text-xs font-medium ${painBgClass(inj.pain)} hover:opacity-80 transition-opacity`}
              >
                {inj.label}: {inj.pain}/10 (Stage {inj.stage})
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
