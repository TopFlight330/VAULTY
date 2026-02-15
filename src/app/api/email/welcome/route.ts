import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "Vaulty <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Vaulty!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f43f8e;">Welcome to Vaulty, ${name}!</h1>
          <p>You've joined the platform built for creator independence.</p>
          <p>Zero algorithm. Zero unfair cuts. Total control.</p>
          <br />
          <p>- The Vaulty Team</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
