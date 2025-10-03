import { client, pubSubClient } from "@/packages/redis";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export function GET() {
    return NextResponse.json({
        message: "Hi from the backend"
    })
}

export async function POST(req: NextRequest) {
    const payload: {
        lang: string,
        code: string
    } = await req.json();

    const id = uuidv4();
    const submission = {...payload, id}

    await client.lPush("submissions", JSON.stringify(submission));

    const output: string = await new Promise((resolve) => {
        pubSubClient.subscribe(id, (message) => {
            console.log(`Output for ${id}:`);
            console.log(message);
            pubSubClient.unsubscribe(id);
            resolve(message);
        })
    })

    return NextResponse.json({
        message: "Submitted successfully",
        channelSubscribed: id,
        output: output
    })
}