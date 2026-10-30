import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MultimodalComplaintForm } from '../../components/multimodal/MultimodalComplaintForm';
import { useTranslation } from '../../i18n/LanguageContext';

export const FacultyReportPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'FACULTY', path: '/app/faculty/home' },
          { label: 'REPORT CLASSROOM ISSUE' },
        ]}
      />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          {t.complaintForm.title} (Faculty Portal)
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 max-w-2xl">
          Report teaching hardware failures, AV projector bugs, or lab disruptions. High priority is automatically routed during academic hours.
        </p>
      </div>

      <MultimodalComplaintForm returnRoute="/app/faculty/home" />
    </div>
  );
};
