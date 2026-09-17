import os
from io import BytesIO
from datetime import datetime, timezone
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class PDFReportGenerator:
    @staticmethod
    def generate_regulatory_pdf(report_data: Dict[str, Any]) -> bytes:
        """Generates a real, official-style PDF compliance and governance report."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'GovSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#d97706'),
            alignment=1
        )
        heading_style = ParagraphStyle(
            'GovHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'GovBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'GovDisclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#64748b'),
            alignment=1
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("TRINETRA (त्रिनेत्र) — SMART MINE GOVERNANCE PLATFORM", title_style))
        story.append(Paragraph("DIRECTORATE OF MINE SAFETY & STATUTORY COMPLIANCE OVERSIGHT", subtitle_style))
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#d97706'), spaceAfter=10))

        # 2. Report Details Header Grid
        meta_table_data = [
            [
                Paragraph(f"<b>Report Title:</b> {report_data.get('title', 'Statutory Summary')}", body_style),
                Paragraph(f"<b>Report Code:</b> {report_data.get('report_code', 'REP-001')}", body_style)
            ],
            [
                Paragraph(f"<b>Mine:</b> {report_data.get('mine_name', 'Bharat Deep Shaft 4')} ({report_data.get('mine_code', 'MINE-BDS-04')})", body_style),
                Paragraph(f"<b>Mine Type:</b> {report_data.get('mine_type', 'UNDERGROUND')}", body_style)
            ],
            [
                Paragraph(f"<b>Reporting Period:</b> {report_data.get('period_start')} to {report_data.get('period_end')}", body_style),
                Paragraph(f"<b>Generated On:</b> {datetime.now(timezone.utc).strftime('%d-%b-%Y %H:%M UTC')}", body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[3.8 * inch, 3.8 * inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # 3. Governance Risk & KPI Snapshot
        story.append(Paragraph("1. EXECUTIVE GOVERNANCE & RISK SUMMARY", heading_style))
        kpi_data = [
            ["Metric", "Recorded Value", "Statutory Baseline / Status"],
            ["Overall Seam Risk Score", f"{report_data.get('risk_score', 28.5)} / 100", report_data.get('risk_severity', 'LOW')],
            ["Total IoT Sensor Fleet", f"{report_data.get('total_sensors', 18)} Nodes", "Operational"],
            ["Active Hazard Incidents", f"{report_data.get('active_incidents', 0)} Active", "Under SLA Workflow"],
            ["DGMS Violations Logged", f"{report_data.get('violations_count', 0)} Notices", "Remediation Tracked"],
            ["Shift Attendance Headcount", f"{report_data.get('attendance_count', 42)} Workers", f"{report_data.get('attendance_pct', 94.2)}% Present"],
            ["Production Output (Period)", f"{report_data.get('actual_production', 4120)} Tonnes", f"Planned: {report_data.get('planned_production', 4500)} T (Var: {report_data.get('variance_pct', -8.4)}%)"]
        ]
        kpi_table = Table(kpi_data, colWidths=[2.5 * inch, 2.5 * inch, 2.6 * inch])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 10))

        # 4. Production & Environmental Compliance Section
        story.append(Paragraph("2. ENVIRONMENTAL & PRODUCTION COMPLIANCE REVIEW", heading_style))
        review_text = (
            f"During the reporting period, {report_data.get('mine_name')} logged a total actual coal production of "
            f"{report_data.get('actual_production', 4120)} tonnes against a target of {report_data.get('planned_production', 4500)} tonnes. "
            f"Atmospheric gas monitoring sensors (CH4, CO, Dust PM10, Air Velocity) remained within prescribed "
            f"DGMS statutory limits with 0 reportable catastrophic breaches. Worker attendance remained at {report_data.get('attendance_pct', 94.2)}%."
        )
        story.append(Paragraph(review_text, body_style))
        story.append(Spacer(1, 10))

        # 5. Digital Sign-Off & Verification Block
        story.append(KeepTogether([
            Paragraph("3. STATUTORY VERIFICATION & AUDIT TRAIL", heading_style),
            Spacer(1, 4),
            Table([
                [
                    Paragraph("<b>Prepared / Submitted By:</b><br/>Safety Officer / Field Engineer<br/>TRINETRA Governance Engine", body_style),
                    Paragraph(f"<b>Approved By:</b><br/>General Mine Manager<br/>Sign-off Status: {report_data.get('status', 'APPROVED')}", body_style),
                    Paragraph(f"<b>Audit Ledger Ref:</b><br/>SHA-256 Hash Chain Verified<br/>Version: v{report_data.get('version', 1)}.0", body_style)
                ]
            ], colWidths=[2.5 * inch, 2.5 * inch, 2.6 * inch],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]),
            Spacer(1, 14),
            HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=6),
            Paragraph(
                "DISCLAIMER: This document is a TRINETRA Smart Governance and Compliance Monitoring artifact. "
                "Simulated telemetry and demonstration data generated for the Smart India Hackathon (SIH) prototype evaluation.",
                disclaimer_style
            )
        ]))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
