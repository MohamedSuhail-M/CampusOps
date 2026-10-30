import React, { useState } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { useTranslation } from '../../i18n/LanguageContext';

export const StudentHelpPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I scan an equipment QR code?',
      a: 'Click "Scan Equipment QR" on the complaint form. Grant camera access when prompted by your browser, then point the lens at the QR badge affixed to campus hardware (projectors, split ACs, access points, power distribution boards). The system instantly queries the campus database and auto-fills building, room, and equipment records.',
    },
    {
      q: 'Which languages are supported for voice dictation?',
      a: 'Native Indian English (en-IN), Tamil (ta-IN), and Hindi (hi-IN) are supported. Select your preferred language at the top of the form, click "Voice Dictation", speak into your microphone, and verify the transcribed text in the description box before submitting.',
    },
    {
      q: 'What types of photo evidence are accepted?',
      a: 'You can upload up to 3 photos (JPEG, PNG, or WebP), with a maximum size of 5MB per file. You can browse saved photos from your hard drive or use your phone/laptop camera directly via the "Take Live Photo" button.',
    },
    {
      q: 'What do the incident statuses mean?',
      a: '• OPEN/PENDING: Incident received and cataloged by the triage engine.\n• ASSIGNED: A qualified technician has been dispatched (e.g. Manoj Kumar for electrical repairs).\n• IN_PROGRESS: Technician has begun physical diagnostics on site.\n• BLOCKED: Work paused pending parts procurement from Central Inventory.\n• RESOLVED: Repair completed, verified, and closed in the audit log.',
    },
    {
      q: 'What happens if another student reports the same issue?',
      a: 'The CampusOps triage engine uses spatial and temporal correlation. If multiple students report the same projector failure in Room B-204, the system automatically correlates them as RELATED reports under the master incident to prevent duplicate work orders.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      !search ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'HELP & SUPPORT' },
        ]}
      />

      {/* Header */}
      <div className="space-y-2 border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          {t.helpPage.title}
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400">
          {t.helpPage.subtitle}
        </p>

        {/* Search */}
        <div className="relative pt-2 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-4.5 text-neutral-400 text-base">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.helpPage.searchPlaceholder}
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-brandCream placeholder:text-neutral-500 font-mono focus:outline-none focus:border-brandLime"
          />
        </div>
      </div>

      {/* Quick Visual Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-brandLime/10 border border-brandLime/40 flex items-center justify-center text-brandLime">
            <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
          </div>
          <h3 className="font-display font-bold uppercase text-xs text-brandCream">
            {t.helpPage.qrGuideTitle}
          </h3>
          <p className="text-[11px] font-sans text-neutral-400">
            Instant camera decoding maps hardware assets directly to campus inventory IDs.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-brandLime/10 border border-brandLime/40 flex items-center justify-center text-brandLime">
            <span className="material-symbols-outlined text-xl">mic</span>
          </div>
          <h3 className="font-display font-bold uppercase text-xs text-brandCream">
            {t.helpPage.voiceGuideTitle}
          </h3>
          <p className="text-[11px] font-sans text-neutral-400">
            Speech-to-text dictation supports Tamil, Hindi, and English with live transcript editing.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-brandLime/10 border border-brandLime/40 flex items-center justify-center text-brandLime">
            <span className="material-symbols-outlined text-xl">photo_camera</span>
          </div>
          <h3 className="font-display font-bold uppercase text-xs text-brandCream">
            {t.helpPage.photoGuideTitle}
          </h3>
          <p className="text-[11px] font-sans text-neutral-400">
            Upload up to 3 visual proofs per ticket with private, tamper-evident storage.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <h2 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
          {t.helpPage.faqHeader}
        </h2>

        <div className="divide-y divide-[#2A2A2A]">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold font-sans text-brandCream hover:text-brandLime transition-colors py-1"
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-base text-neutral-400">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs font-sans text-neutral-300 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-brandLime">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
