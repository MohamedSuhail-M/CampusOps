import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation();

  // If explicit items provided, use them; otherwise infer from URL path
  const crumbs: BreadcrumbItem[] = items || (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: 'CAMPUSOPS', path: '/' }];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      currentPath += `/${seg}`;

      // Format label
      let label = seg.replace(/[-_]/g, ' ').toUpperCase();
      if (seg === 'app') continue;
      if (seg === 'student') label = 'STUDENT';
      else if (seg === 'faculty') label = 'FACULTY';
      else if (seg === 'technician') label = 'TECHNICIAN';
      else if (seg === 'dept-manager') label = 'DEPT MGR';
      else if (seg === 'facilities') label = 'FACILITIES';
      else if (seg === 'procurement') label = 'PROCUREMENT';
      else if (seg === 'sysadmin') label = 'SYSTEM ADMIN';

      result.push({
        label,
        path: i === segments.length - 1 ? undefined : currentPath,
      });
    }
    return result;
  })();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400 mb-4 select-none overflow-x-auto py-1">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-neutral-600">/</span>}
            {crumb.path && !isLast ? (
              <Link
                to={crumb.path}
                className="hover:text-brandLime transition-colors uppercase truncate max-w-[150px]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={`uppercase font-bold truncate max-w-[200px] ${isLast ? 'text-brandLime' : 'text-neutral-400'}`}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
