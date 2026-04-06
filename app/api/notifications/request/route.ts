import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function requestTypeLabel(type?: string | null) {
  if (!type || type === "transfer") return "Transfer";
  if (type === "pickup_request") return "Pickup Request";
  if (type === "shipment_request") return "Shipment Request";
  return type;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return Response.json({ error: "Missing auth token." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const companyName = String(body.companyName || "").trim();
    const requestType = String(body.requestType || "").trim();
    const destination = String(body.destination || "").trim();
    const quantity = Number(body.quantity || 0);
    const requestDate = String(body.requestDate || "").trim();
    const notes = String(body.notes || "").trim();
    const transferNumber = String(body.transferNumber || "").trim();
    const userId = String(body.userId || "").trim();

    if (!companyName || !requestType || !destination || !requestDate || !transferNumber) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (userId !== user.id) {
      return Response.json({ error: "User mismatch." }, { status: 403 });
    }

    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;
    const toEmail = process.env.NOTIFICATION_TO_EMAIL;

    if (!fromEmail || !toEmail) {
      return Response.json(
        { error: "Notification email environment variables are missing." },
        { status: 500 }
      );
    }

    const resend = getResend();

    const subject = `[Adams Pallet Plus] ${requestTypeLabel(requestType)} submitted — ${transferNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin-bottom: 16px;">New ${escapeHtml(requestTypeLabel(requestType))}</h2>

        <table style="border-collapse: collapse; width: 100%; max-width: 700px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Transfer #</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(transferNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Type</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(requestTypeLabel(requestType))}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Company</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(companyName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">User Email</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(user.email || "")}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Destination / Location</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(destination)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Quantity</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Requested Date</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(requestDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">Notes</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(notes || "—")}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">Review this request in the admin dashboard.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: "Email failed to send." }, { status: 500 });
    }

    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("Notification route error:", error);
    return Response.json({ error: "Failed to send notification." }, { status: 500 });
  }
}