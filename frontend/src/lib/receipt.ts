import { jsPDF } from "jspdf";
import { formatDate, getSettings, type Payment, type Student } from "./store";
import logoAsset from "@/assets/logo.png.asset.json";

const rs = (n: number) => "Rs. " + (Number(n) || 0).toLocaleString("en-IN");

let defaultLogoData = "";

async function loadDefaultLogo() {
  if (defaultLogoData || typeof window === "undefined") return defaultLogoData;
  try {
    const res = await fetch(logoAsset.url);
    const blob = await res.blob();
    defaultLogoData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    defaultLogoData = "";
  }
  return defaultLogoData;
}

function renderMarathiTextImage(text: string): string {
  if (typeof document === "undefined") return "";
  try {
    const scale = 4;
    const canvas = document.createElement("canvas");
    canvas.width = 600 * scale;
    canvas.height = 36 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.scale(scale, scale);
    ctx.font = "bold 13px Arial, 'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', sans-serif";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 300, 18);

    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

export function buildReceiptDoc(student: Student, payment: Payment) {
  const s = getSettings();
  const logo = s.logo || defaultLogoData;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth(); // 595.28 pt

  let y = 35;

  // 1. Header (Logo + Institute details)
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 32, y - 8, 44, 44);
    } catch {
      /* ignore bad logo */
    }
  }
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(0, 0, 0);
  doc.text(s.instituteName, logo ? 84 : 32, y + 8);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(55, 65, 81);
  doc.text(s.address, logo ? 84 : 32, y + 22, { maxWidth: W - 120 });
  doc.text(`${s.mobile}  |  ${s.email}`, logo ? 84 : 32, y + 34);

  // Divider Line
  y += 48;
  doc.setDrawColor(30, 58, 95).setLineWidth(1).line(32, y, W - 32, y);

  // 2. Title Banner
  y += 24;
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(0, 0, 0);
  doc.text("FEE RECEIPT", W / 2, y, { align: "center" });

  // 3. Receipt Subheader (Receipt No & Date)
  y += 22;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(31, 41, 55);
  doc.text(`Receipt No: ${payment.receiptNo}`, 32, y);
  doc.text(`Receipt Date: ${formatDate(payment.date)}`, W - 32, y, { align: "right" });

  // 4. Full Width Key-Value Rows (Single Table with Alternating Shaded Rows)
  y += 14;
  const rows: [string, string][] = [
    ["Student Name", student.name],
    ["Mobile", student.mobile],
    ["Course", student.course],
    ["Batch", student.batch + (student.year ? ` (${student.year})` : "")],
    ["Total Course Fee", rs(student.totalFee)],
    ["Current Payment", rs(payment.amount)],
    ["Total Paid", rs(student.paidFee)],
    ["Remaining Fee", rs(payment.remainingAfter)],
    ["Payment Mode", payment.mode + (payment.upiReference ? ` (${payment.upiReference})` : "")],
    ["Next Payment Due Date", payment.nextDueDate ? formatDate(payment.nextDueDate) : "Fully Paid"],
  ];

  rows.forEach(([k, v], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(244, 247, 251).rect(32, y - 10, W - 64, 20, "F");
    }
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(55, 65, 81);
    doc.text(k, 42, y + 3);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(0, 0, 0);
    doc.text(String(v), W - 42, y + 3, { align: "right" });
    y += 20;
  });

  // 5. Footer Section
  y += 24;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(0, 0, 0);
  doc.text("Thank you!", 32, y);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(156, 163, 175);
  doc.text("This is a computer generated receipt.", 32, y + 14);

  doc.text("Authorised Signatory", W - 32, y + 14, { align: "right" });

  const marathiImg = renderMarathiTextImage("एकदा भरलेली फी कोणत्याही कारणास्तव परत मिळणार नाही.");
  if (marathiImg) {
    try {
      doc.addImage(marathiImg, "PNG", W / 2 - 180, y + 20, 360, 22);
    } catch {
      /* ignore canvas error */
    }
  }

  // Bottom half of the A4 page remains clean empty space
  return doc;
}

export async function downloadReceipt(student: Student, payment: Payment) {
  await loadDefaultLogo();
  buildReceiptDoc(student, payment).save(`${payment.receiptNo}-${student.name}.pdf`);
}

export async function printReceipt(student: Student, payment: Payment) {
  await loadDefaultLogo();
  const doc = buildReceiptDoc(student, payment);
  const url = doc.output("bloburl");
  const w = window.open(url as unknown as string, "_blank");
  if (w) w.focus();
}
