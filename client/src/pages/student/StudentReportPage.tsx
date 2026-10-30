import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MultimodalComplaintForm } from '../../components/multimodal/MultimodalComplaintForm';
import { useTranslation } from '../../i18n/LanguageContext';

export const StudentReportPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'SUBMIT COMPLAINT' },
        ]}
      />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          {t.complaintForm.title}
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 max-w-2xl">
          {t.complaintForm.subtitle}
        </p>
      </div>

      <MultimodalComplaintForm returnRoute="/app/student/reports" />
    </div>
  );
};
