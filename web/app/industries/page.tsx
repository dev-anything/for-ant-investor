import type { Metadata } from 'next';
import Link from 'next/link';
import { CountBadge } from '@/components/CountBadge';
import { copy } from '@/lib/copy';
import { getIndustryTopCompaniesForCards, getIndustryTree } from '@/lib/data/industry';
import { cleanSectionName } from '@/lib/format';
import { attachTopCompanies, groupIndustryTree } from '@/lib/industry';

// FS 3-3: 업종 화면 1시간
export const revalidate = 3600;

export const metadata: Metadata = { title: copy.industry.listMeta };

// FS 9-7 `/industries` (서버): DESIGN 5-4대로 대분류 제목 아래 중분류 카드를 격자로 펼친다 (접기 없음).
export default async function IndustriesPage() {
  // 업종 트리와 상위 회사를 병렬로 부르고 division_code로 합친다 (5-9 실패 시 회사 줄만 생략).
  const [tree, topCompanies] = await Promise.all([getIndustryTree(), getIndustryTopCompaniesForCards()]);
  const sections = attachTopCompanies(groupIndustryTree(tree), topCompanies);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{copy.industry.listTitle}</h1>
      <p className="mt-2 text-sm text-ink-sub">{copy.industry.listIntro}</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.sectionCode} aria-labelledby={`section-${section.sectionCode}`}>
            <h2
              id={`section-${section.sectionCode}`}
              className="flex items-start justify-between gap-3 text-lg font-semibold text-ink"
            >
              <span className="min-w-0 break-keep break-words">
                {cleanSectionName(section.sectionName) ?? section.sectionName}
              </span>
              <CountBadge count={section.companyCount} />
            </h2>
            {/* 표준산업분류 이름은 줄이지 않고 카드 안에서 줄바꿈한다 (라이선스). */}
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.divisions.map((division) => (
                <li key={division.divisionCode}>
                  <Link
                    href={`/industries/${division.divisionCode}`}
                    className="block h-full rounded-lg border border-line bg-surface p-4 transition-colors hover:border-brand sm:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <span className="min-w-0 flex-1 break-keep break-words text-base font-medium text-ink">
                        {division.divisionName}
                      </span>
                      <CountBadge count={division.companyCount} />
                    </div>
                    {/* 카드 전체가 링크라 회사 이름은 링크로 만들지 않는다 (DESIGN-V2 3-1). */}
                    {division.companyNames.length > 0 && (
                      <p className="mt-3 break-keep text-sm text-ink-sub">
                        {copy.industry.companyLine(division.companyNames)}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
