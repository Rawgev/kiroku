import { redirect } from 'next/navigation';

export default async function MangaRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  if (params.sort === 'popular') {
    redirect('/search?type=MANGA&sort=POPULARITY_DESC');
  }
  redirect('/search?type=MANGA');
}
