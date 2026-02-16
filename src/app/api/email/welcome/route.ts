import { resend } from "@/lib/resend";
import { getWelcomeEmailHtml } from "@/lib/emails/welcome-template";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "Vaulty <noreply@vaulty.com>",
      to: email,
      subject: "Welcome to Vaulty!",
      html: getWelcomeEmailHtml(name),
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
