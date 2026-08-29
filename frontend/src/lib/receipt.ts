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

export function buildReceiptDoc(student: Student, payment: Payment) {
  const s = getSettings();
  const logo = s.logo || defaultLogoData;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  if (logo) {
    try {
      doc.addImage(logo, "PNG", 40, y - 10, 56, 56);
    } catch {
      /* ignore bad logo */
    }
  }
  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text(s.instituteName, logo ? 108 : 40, y + 8);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(s.address, logo ? 108 : 40, y + 26, { maxWidth: W - 160 });
  doc.text(`${s.mobile}  |  ${s.email}`, logo ? 108 : 40, y + 42);

  y += 66;
  doc.setDrawColor(30, 58, 95).setLineWidth(1.2).line(40, y, W - 40, y);
  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("FEE RECEIPT", W / 2, y, { align: "center" });
  y += 24;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Receipt No: ${payment.receiptNo}`, 40, y);
  doc.text(`Receipt Date: ${formatDate(payment.date)}`, W - 40, y, { align: "right" });

  y += 22;
  const rows: [string, string][] = [
    ["Student Name", student.name],
    ["Mobile", student.mobile],
    ["Course", student.course],
    ["Batch", student.batch],
    ["Total Course Fee", rs(student.totalFee)],
    ["Current Payment", rs(payment.amount)],
    ["Total Paid", rs(student.paidFee)],
    ["Remaining Fee", rs(payment.remainingAfter)],
    ["Payment Mode", payment.mode],
    ...(payment.mode === "UPI" ? [["UPI Reference", payment.upiReference || "—"] as [string, string]] : []),
    ["Next Payment Due Date", payment.nextDueDate ? formatDate(payment.nextDueDate) : "Fully Paid"],
  ];
  rows.forEach(([k, v], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(244, 247, 251).rect(40, y - 12, W - 80, 22, "F");
    }
    doc.setFont("helvetica", "normal").text(k, 52, y + 3);
    doc.setFont("helvetica", "bold").text(String(v), W - 52, y + 3, { align: "right" });
    y += 22;
  });

  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(12);
  doc.text("Thank you!", 40, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
  doc.text("This is a computer generated receipt.", 40, y + 16);

  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(0);
  doc.text(
    "एकदा भरलेली फी कोणत्याही कारणास्तव परत मिळणार नाही",
    W / 2,
    y + 34,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
  doc.text("Authorised Signatory", W - 40, y + 16, { align: "right" });
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
