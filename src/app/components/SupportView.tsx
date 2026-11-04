// @ts-nocheck -- imported original app code, kept unchanged
import React from 'react';
import { Shell } from './Shell';
import { useBot } from '../context/BotContext';
import { WHATSAPP_URL, TELEGRAM_URL, PHONE_NUMBER } from '../constants.ts';
import { MessageSquare, Send, Phone, Clock } from 'lucide-react';

export const SupportView: React.FC = () => {
  const { appConfig } = useBot();

  const whatsapp = appConfig?.whatsappUrl || WHATSAPP_URL;
  const telegram = appConfig?.telegramUrl || TELEGRAM_URL;
  const phone = appConfig?.phone || PHONE_NUMBER;

  return (
    <Shell>
      <section className="terminal">
        <h2 className="terminal-heading">
          SUPPORT <span>CENTER</span>
        </h2>
        <p className="terminal-subtitle">Our team is available 24/7 to help you</p>

        <div className="support-list">
          <a
            className="link-row"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <MessageSquare className="text-[var(--buy)]" />
            <div>
              <strong>WhatsApp Group</strong>
              <small>Join the FR-KINGs community & updates</small>
            </div>
          </a>

          <a
            className="link-row"
            href={telegram}
            target="_blank"
            rel="noreferrer"
          >
            <Send className="text-[var(--primary)]" />
            <div>
              <strong className="text-[var(--primary)]">Telegram Channel</strong>
              <small>@frking786 — live updates & market alerts</small>
            </div>
          </a>

          <a
            className="link-row"
            href={`tel:${phone}`}
          >
            <Phone className="text-[var(--warning)]" />
            <div>
              <strong>Contact Number</strong>
              <small>{phone}</small>
            </div>
          </a>
        </div>

        <p className="signal-note flex items-center justify-center gap-1.5 mt-4">
          <Clock size={12} className="text-[var(--primary)]" />
          <span>Average response time: under 5 minutes</span>
        </p>
      </section>
    </Shell>
  );
};
