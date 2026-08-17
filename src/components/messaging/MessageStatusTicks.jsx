import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/**
 * WhatsApp-Style 3-State Message Status Ticks Component
 * 
 * 1. Single grey check (✓) : Sent to database / Recipient is offline
 * 2. Double grey check (✓✓) : Delivered / Recipient is currently online
 * 3. Double blue check (✓✓) : Read / Viewed by recipient
 */
export default function MessageStatusTicks({
  status = 'sent',
  isRead = false,
  isRecipientOnline = false,
  size = 14,
  style = {}
}) {
  const isMessageRead = isRead === true || status === 'read';
  const isMessageDelivered = !isMessageRead && (status === 'delivered' || isRecipientOnline === true);

  if (isMessageRead) {
    return (
      <span
        title="Vu / Lu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#38BDF8', // WhatsApp / StageLink Sky Blue Read Tick
          lineHeight: 1,
          verticalAlign: 'middle',
          ...style
        }}
      >
        <CheckCheck size={size} strokeWidth={2.4} />
      </span>
    );
  }

  if (isMessageDelivered) {
    return (
      <span
        title="Distribué / En ligne"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#94A3B8', // Slate Grey Delivered Double Tick
          lineHeight: 1,
          verticalAlign: 'middle',
          ...style
        }}
      >
        <CheckCheck size={size} strokeWidth={2.2} />
      </span>
    );
  }

  // Single Grey Tick for Sent / Offline
  return (
    <span
      title="Envoyé"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: '#94A3B8', // Slate Grey Sent Single Tick
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style
      }}
    >
      <Check size={size} strokeWidth={2.2} />
    </span>
  );
}
