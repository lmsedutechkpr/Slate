import { Button } from '@/components/ui/button';

const Crumb = ({ href, label, isLast }) => (
  <li className="inline-flex items-center">
    {href && !isLast ? (
      <a href={href} className="text-sm text-gray-600 hover:text-gray-900">{label}</a>
    ) : (
      <span className="text-sm font-medium text-gray-900">{label}</span>
    )}
    {!isLast && <span className="mx-2 text-gray-400">/</span>}
  </li>
);

const InstructorHeader = ({ title, subtitle, breadcrumbs = [], actions = [] }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="mb-1" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex">
              {breadcrumbs.map((c, idx) => (
                <Crumb key={idx} href={c.href} label={c.label} isLast={idx === breadcrumbs.length - 1} />
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((a, idx) => (
            <Button key={idx} {...(a.props || {})} onClick={a.onClick}>{a.icon}{a.label}</Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorHeader;


