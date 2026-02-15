import { NextRequest, NextResponse } from "next/server";
import {
  startSimulator,
  stopSimulator,
  getSimulatorStatus,
  addBadActor,
  addLegitimateUser,
  addHighThroughputLegitimate,
  removePersona,
} from "@/services/simulator";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    action: string;
    legitimateCount?: number;
    badActorCount?: number;
    highThroughputCount?: number;
    profileIndex?: number;
    personaId?: string;
  };

  switch (body.action) {
    case "start": {
      return NextResponse.json(
        startSimulator(undefined, {
          legitimateCount: body.legitimateCount,
          badActorCount: body.badActorCount,
          highThroughputCount: body.highThroughputCount,
        })
      );
    }
    case "stop":
      return NextResponse.json(stopSimulator());
    case "spawn_bad_actor": {
      const badActorPersona = addBadActor(body.profileIndex ?? 0);
      if (badActorPersona) {
        return NextResponse.json({
          status: "spawned",
          personas: [{
            id: badActorPersona.id,
            accountId: badActorPersona.accountId,
            type: badActorPersona.type,
            targetRate: badActorPersona.targetRate,
          }],
        });
      }
      return NextResponse.json(
        { error: "Simulator not running" },
        { status: 400 }
      );
    }
    case "spawn_legitimate": {
      const legitUserPersona = addLegitimateUser(body.profileIndex ?? 0);
      if (legitUserPersona) {
        return NextResponse.json({
          status: "spawned",
          personas: [{
            id: legitUserPersona.id,
            accountId: legitUserPersona.accountId,
            type: legitUserPersona.type,
            targetRate: legitUserPersona.targetRate,
          }],
        });
      }
      return NextResponse.json(
        { error: "Simulator not running" },
        { status: 400 }
      );
    }
    case "spawn_high_throughput": {
      const legitPersona = addHighThroughputLegitimate(body.profileIndex ?? 0);
      if (legitPersona) {
        return NextResponse.json({
          status: "spawned",
          personas: [{
            id: legitPersona.id,
            accountId: legitPersona.accountId,
            type: legitPersona.type,
            targetRate: legitPersona.targetRate,
          }],
        });
      }
      return NextResponse.json(
        { error: "Simulator not running" },
        { status: 400 }
      );
    }
    case "remove_persona": {
      if (!body.personaId) {
        return NextResponse.json({ error: "personaId is required" }, { status: 400 });
      }

      const removed = removePersona(body.personaId);
      if (!removed) {
        return NextResponse.json(
          { error: "Simulator not running or persona not found" },
          { status: 400 },
        );
      }

      return NextResponse.json({ status: "removed", personaId: body.personaId });
    }
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(getSimulatorStatus());
}
