import { Candidate, Allocation, DHQ_STAFF_ROLES, RoleCategory } from "@/types";
import { PARTY_LABELS } from "./ui";

/**
 * Generates and downloads a clean Microsoft Word (.doc) document containing
 * filtered or complete staff roster with appointment orders, CNIC, UC, and reference codes.
 */
export function exportStaffRosterToWord(
  records: Array<{
    candidate: Candidate;
    allocation?: Allocation;
  }>,
  title = "DHQ Teaching Hospital D.I. Khan - Staff Recruitment & Appointment Roster"
) {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tableRowsHtml = records
    .map(({ candidate, allocation }, index) => {
      const refLabel = candidate.referenceCode
        ? PARTY_LABELS[candidate.referenceCode] || candidate.referenceCode
        : PARTY_LABELS[candidate.partyAffiliation] || candidate.partyAffiliation;

      const roleTitle =
        allocation?.roleTitle ||
        candidate.appliedRole ||
        "Staff Candidate";

      const appointmentNo =
        allocation?.appointmentRefNo ||
        candidate.appointmentOrderNo ||
        "Under Direct Process";

      const joiningNo =
        allocation?.joiningOrderNo ||
        candidate.joiningOrderNo ||
        "Pending Verification";

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11pt;">
          <td style="padding: 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 8px;">
            <strong>${candidate.fullName}</strong><br/>
            <span style="color: #64748b; font-size: 9.5pt;">S/D/W of ${candidate.fatherName}</span>
          </td>
          <td style="padding: 8px; font-family: monospace;">
            <strong>${candidate.cnic}</strong><br/>
            <span style="color: #64748b; font-size: 9.5pt;">Father: ${candidate.fatherCnic || "N/A"}</span>
          </td>
          <td style="padding: 8px;">
            <strong style="color: #0f766e;">${roleTitle}</strong><br/>
            <span style="color: #475569; font-size: 9.5pt;">${allocation?.department || "DHQ Hospital"}</span>
          </td>
          <td style="padding: 8px;">
            <strong>${candidate.tehsil || "Dera"}</strong><br/>
            <span style="color: #64748b; font-size: 9.5pt;">${candidate.unionCouncil || "UC N/A"}</span>
          </td>
          <td style="padding: 8px; font-size: 10pt;">
            <span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
              ${refLabel}
            </span>
          </td>
          <td style="padding: 8px; font-size: 9.5pt;">
            Appt: <strong>${appointmentNo}</strong><br/>
            Join: <strong>${joiningNo}</strong>
          </td>
          <td style="padding: 8px; text-align: center;">
            <span style="font-weight: bold; color: ${allocation?.status === "Active" ? "#16a34a" : "#ca8a04"};">
              ${allocation?.status || candidate.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  const contentHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          color: #0f172a;
          margin: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18pt;
          margin: 0 0 4px 0;
          color: #0f766e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header h2 {
          font-size: 13pt;
          margin: 0 0 6px 0;
          color: #334155;
          font-weight: normal;
        }
        .meta-bar {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
          color: #64748b;
          margin-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #0f766e;
          color: #ffffff;
          font-size: 10.5pt;
          text-align: left;
          padding: 10px 8px;
        }
        .confidential-notice {
          margin-top: 30px;
          padding: 12px;
          background-color: #f8fafc;
          border-left: 4px solid #0f766e;
          font-size: 9.5pt;
          color: #475569;
        }
        .signatures {
          margin-top: 50px;
          width: 100%;
        }
        .sig-box {
          display: inline-block;
          width: 45%;
          text-align: center;
          font-size: 10.5pt;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DHQ Teaching Hospital Dera Ismail Khan</h1>
        <h2>Staff Recruitment, Verification & Appointment Official Ledger</h2>
        <div style="font-size: 11pt; color: #0284c7; font-weight: bold; margin-top: 5px;">
          ${title}
        </div>
      </div>

      <div class="meta-bar">
        <div><strong>Generated Date:</strong> ${currentDate}</div>
        <div><strong>Total Staff Records:</strong> ${records.length}</div>
        <div><strong>Authority:</strong> Executive Directorate / Medical Superintendent</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 4%; text-align: center;">#</th>
            <th style="width: 18%;">Staff Name & Parentage</th>
            <th style="width: 15%;">CNIC / Father CNIC</th>
            <th style="width: 18%;">Assigned DHQ Role</th>
            <th style="width: 14%;">Tehsil & Union Council</th>
            <th style="width: 13%;">Reference Alias</th>
            <th style="width: 12%;">Appointment & Joining No</th>
            <th style="width: 6%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="confidential-notice">
        <strong>Official Compliance Notice:</strong> This document contains verified personnel data strictly governed by DHQ Hospital Recruitment Rules. In compliance with privacy standards, political designations are masked into authorized reference codes (DIR-OFFICE, REF-NA-01, REF-PA-01, MERIT-OPEN).
      </div>

      <div class="signatures">
        <div class="sig-box" style="float: left;">
          _______________________________<br/>
          <strong>Medical Superintendent (MS)</strong><br/>
          DHQ Teaching Hospital D.I. Khan
        </div>
        <div class="sig-box" style="float: right;">
          _______________________________<br/>
          <strong>Hospital Director / Executive</strong><br/>
          DHQ Teaching Hospital D.I. Khan
        </div>
        <div style="clear: both;"></div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", contentHtml], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DHQ_Staff_Roster_${new Date().toISOString().split("T")[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
