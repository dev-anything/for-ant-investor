import type { Metadata } from 'next';
import Link from 'next/link';
import { getIndustryTree } from '@/lib/data/industry';
import { cleanSectionName } from '@/lib/format';
import { groupIndustryTree } from '@/lib/industry';
import { copy } from '@/lib/copy';

// FS 3-3: 업종 화면 1시간
export const revalidate = 3600;

export const metadata: Metadata = { title: copy.industry.listMeta };

// FS 9-7 `/industries` (서버): 대분류를 펼치면 중분류가 보인다. 펼침은 <details>만 쓴다 (JS 없음, 처음엔 모두 닫힘)
export default async function IndustriesPage() {
  const sections = groupIndustryTree(await getIndustryTree());

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-ink-sub">{copy.industry.listTitle}</h1>
      <p className="mt-2 text-sm text-ink-sub">{copy.industry.listIntro}</p>
      <div className="mt-6 space-y-1">
        {sections.map((section) => (
          <details key={section.sectionCode} className="border-b border-line py-2">
            <summary className="cursor-pointer py-1 font-medium text-ink">
              {copy.industry.withCount(
                cleanSectionName(section.sectionName) ?? section.sectionName,
                section.companyCount
              )}
            </summary>
            <ul className="mt-1 space-y-1 pl-5 text-sm">
              {section.divisions.map((division) => (
                <li key={division.divisionCode}>
                  <Link
                    href={`/industries/${division.divisionCode}`}
                    className="text-ink underline underline-offset-2 hover:decoration-2"
                  >
                    {copy.industry.withCount(division.divisionName, division.companyCount)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
