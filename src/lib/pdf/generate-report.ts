import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Campaign, CampaignReport } from '@/types';

export function generateCampaignReport(report: CampaignReport) {
  const doc = new jsPDF();
  const { campaign, rescuerNames, deviceNames } = report;

  // Header
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Nishan-e-Zindagi', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Disaster Rescue System - Campaign Report', 14, 30);
  doc.setDrawColor(255, 255, 255);

  // Campaign Overview
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text('Campaign Overview', 14, 48);
  doc.setTextColor(0);

  const campaignName = campaign.name || `Campaign #${campaign.id.slice(-6).toUpperCase()}`;
  const status = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
  const created = new Date(campaign.createdAt).toLocaleString();
  const updated = new Date(campaign.updatedAt).toLocaleString();
  const duration = getDurationStr(campaign.createdAt, campaign.resolvedAt || campaign.updatedAt);
  const nodeCount = campaign.nodeAssignments?.length || 0;
  const rescuedNodes = campaign.nodeAssignments?.filter(n => n.status === 'rescued').length || 0;
  const rescuerCount = campaign.assignedRescuerIds?.length || 0;
  const survivors = campaign.totalSurvivorsFound || 0;

  autoTable(doc, {
    startY: 52,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    body: [
      ['Campaign Name', campaignName],
      ['Status', status],
      ['Created', created],
      ['Last Updated', updated],
      ['Duration', duration],
      ['Total Nodes', `${rescuedNodes}/${nodeCount} rescued`],
      ['Total Rescuers', String(rescuerCount)],
      ['Survivors Found', String(survivors)],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
  });

  // Node Assignments Table
  const currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text('Node Assignments', 14, currentY);
  doc.setTextColor(0);

  if (campaign.nodeAssignments && campaign.nodeAssignments.length > 0) {
    autoTable(doc, {
      startY: currentY + 4,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      head: [['Device', 'Status', 'Rescuers', 'Survivors', 'Rescued At']],
      body: campaign.nodeAssignments.map(node => [
        deviceNames[node.deviceId] || node.deviceId,
        node.status.charAt(0).toUpperCase() + node.status.slice(1),
        node.assignedRescuerIds.map(id => rescuerNames[id] || id).join(', ') || 'None',
        node.survivorsFound !== undefined ? String(node.survivorsFound) : '-',
        node.rescuedAt ? new Date(node.rescuedAt).toLocaleString() : '-',
      ]),
    });
  }

  // Rescuer Performance Table
  const currentY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  if (currentY2 > 250) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text('Rescuer Performance', 14, 20);
    doc.setTextColor(0);
  } else {
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text('Rescuer Performance', 14, currentY2);
    doc.setTextColor(0);
  }

  const rescuerPerf = (campaign.assignedRescuerIds || []).map(rid => {
    const nodesAssigned = campaign.nodeAssignments?.filter(n => n.assignedRescuerIds.includes(rid)).length || 0;
    const nodesRescued = campaign.nodeAssignments?.filter(n => n.rescuedBy === rid).length || 0;
    const survivorsFound = campaign.nodeAssignments?.filter(n => n.rescuedBy === rid).reduce((sum, n) => sum + (n.survivorsFound || 0), 0) || 0;
    return [rescuerNames[rid] || rid, String(nodesAssigned), String(nodesRescued), String(survivorsFound)];
  });

  if (rescuerPerf.length > 0) {
    autoTable(doc, {
      startY: currentY2 > 250 ? 24 : currentY2 + 4,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      head: [['Rescuer', 'Nodes Assigned', 'Nodes Rescued', 'Survivors Found']],
      body: rescuerPerf,
    });
  }

  // Status Timeline
  const currentY3 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  if (currentY3 > 250) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text('Status Timeline', 14, 20);
    doc.setTextColor(0);
  } else {
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text('Status Timeline', 14, currentY3);
    doc.setTextColor(0);
  }

  autoTable(doc, {
    startY: currentY3 > 250 ? 24 : currentY3 + 4,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
    head: [['Status', 'Timestamp', 'Updated By', 'Note']],
    body: campaign.statusHistory.map(entry => [
      entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace('_', ' '),
      new Date(entry.timestamp).toLocaleString(),
      entry.updatedBy || '-',
      entry.note || '-',
    ]),
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Nishan-e-Zindagi | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`campaign-${campaign.id.slice(-6)}-report.pdf`);
}

export function generateAggregateReport(campaigns: Campaign[], rescuerNames: Record<string, string>) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Nishan-e-Zindagi', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Disaster Rescue System - Aggregate Report', 14, 30);
  doc.setDrawColor(255, 255, 255);

  // Summary
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text('Summary', 14, 48);
  doc.setTextColor(0);

  const totalCampaigns = campaigns.length;
  const resolved = campaigns.filter(c => c.status === 'resolved').length;
  const active = campaigns.filter(c => !['resolved', 'cancelled'].includes(c.status)).length;
  const totalSurvivors = campaigns.reduce((sum, c) => sum + (c.totalSurvivorsFound || 0), 0);
  const totalNodes = campaigns.reduce((sum, c) => sum + (c.nodeAssignments?.length || 0), 0);
  const rescuedNodes = campaigns.reduce((sum, c) => sum + (c.nodeAssignments?.filter(n => n.status === 'rescued').length || 0), 0);

  autoTable(doc, {
    startY: 52,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    body: [
      ['Total Campaigns', String(totalCampaigns)],
      ['Active', String(active)],
      ['Resolved', String(resolved)],
      ['Total Nodes', `${rescuedNodes}/${totalNodes} rescued`],
      ['Total Survivors Found', String(totalSurvivors)],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
  });

  // Campaigns Table
  const currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text('All Campaigns', 14, currentY);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
    head: [['Campaign', 'Status', 'Nodes', 'Rescuers', 'Survivors', 'Date']],
    body: campaigns.map(c => [
      c.name || `#${c.id.slice(-6).toUpperCase()}`,
      c.status.charAt(0).toUpperCase() + c.status.slice(1),
      `${c.nodeAssignments?.filter(n => n.status === 'rescued').length || 0}/${c.nodeAssignments?.length || 0}`,
      (c.assignedRescuerIds || []).map(id => rescuerNames[id] || id).join(', ') || String(c.assignedRescuerIds?.length || 0),
      String(c.totalSurvivorsFound || 0),
      new Date(c.createdAt).toLocaleDateString(),
    ]),
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Nishan-e-Zindagi | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save('nishan-e-zindagi-aggregate-report.pdf');
}

function getDurationStr(startDate: string, endDate: string): string {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
