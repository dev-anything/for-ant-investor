import type { Metadata } from 'next';
import Link from 'next/link';
import { getIndustryTree } from '@/lib/data/industry';
import { cleanSectionName } from '@/lib/format';
import { groupIndustryTree } from '@/lib/industry';
import { copy } from '@/lib/copy';

// FS 3-3: 업종 화면 1시간
export const revalidate = 3600;

export const metadata: Metadata = { title: copy.industry.listMeta };

// FS 9-7 `/industries` (서버): DESIGN 5-4대로 대분류 제목 아래 중분류 카드를 격자로 펼친다 (접기 없음).
export default async function IndustriesPage() {
  const sections = groupIndustryTree(await getIndustryTree());

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{copy.industry.listTitle}</h1>
      <p className="mt-2 text-sm text-ink-sub">{copy.industry.listIntro}</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.sectionCode} aria-labelledby={`section-${section.sectionCode}`}>
            <h2 id={`section-${section.sectionCode}`} className="text-lg font-semibold text-ink">
              {copy.industry.withCount(
                cleanSectionName(section.sectionName) ?? section.sectionName,
                section.companyCount
              )}
            </h2>
            {/* 표준산업분류 이름은 줄이지 않고 카드 안에서 줄바꿈한다 (라이선스). */}
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.divisions.map((division) => (
                <li key={division.divisionCode}>
                  <Link
                    href={`/industries/${division.divisionCode}`}
                    className="block h-full rounded-lg border border-line bg-surface p-4 transition-colors hover:border-brand sm:p-6"
                  >
                    <span className="block break-words text-base font-medium text-ink">
                      {copy.industry.withCount(division.divisionName, division.companyCount)}
                    </span>
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
